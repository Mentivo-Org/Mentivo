'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function ModerationPage() {
  const [stats, setStats] = useState<any>(null);
  const [flaggedMessages, setFlaggedMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, messagesRes] = await Promise.all([
        api.get('/moderation/stats'),
        api.get('/moderation/flagged-messages')
      ]);
      setStats(statsRes.data);
      setFlaggedMessages(messagesRes.data);
    } catch (error) {
      console.error('Failed to fetch moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading moderation data...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Chat Moderation Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Total Messages</p>
          <p className="text-2xl font-bold">{stats?.totalMessages}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-500 text-sm">Blocked Messages</p>
          <p className="text-2xl font-bold">{stats?.blockedMessages}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-gray-500 text-sm">Block Rate</p>
          <p className="text-2xl font-bold">{stats?.blockRate.toFixed(2)}%</p>
        </div>
      </div>

      {/* Flagged Messages Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">Recent Flagged Messages</h2>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 text-sm uppercase text-gray-600">
              <th className="p-4">Time</th>
              <th className="p-4">Sender</th>
              <th className="p-4">Conversation</th>
              <th className="p-4">Content</th>
              <th className="p-4">Violations</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {flaggedMessages.map((msg) => (
              <tr key={msg.id} className="hover:bg-gray-50">
                <td className="p-4 text-sm text-gray-500">
                  {new Date(msg.createdAt).toLocaleString()}
                </td>
                <td className="p-4 text-sm font-medium">
                  {msg.sender.name} ({msg.sender.id.slice(0, 8)})
                </td>
                <td className="p-4 text-sm">
                  {msg.chatSession.student.name} ↔ {msg.chatSession.mentor.name}
                </td>
                <td className="p-4 text-sm max-w-xs truncate">
                  {msg.content}
                </td>
                <td className="p-4">
                  {msg.validationResult?.violations?.map((v: any, i: number) => (
                    <span key={i} className="inline-block bg-red-100 text-red-600 text-xs px-2 py-1 rounded mr-1 mb-1">
                      {v.ruleName}
                    </span>
                  ))}
                </td>
                <td className="p-4">
                  <button className="text-blue-600 hover:underline text-sm">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {flaggedMessages.length === 0 && (
          <div className="p-8 text-center text-gray-400">No flagged messages found.</div>
        )}
      </div>
    </div>
  );
}
