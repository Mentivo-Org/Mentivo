import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Text,
} from "react-native";
import { Image } from "expo-image";
import Svg, { Rect, Circle, Defs, Mask } from "react-native-svg";
import { storage } from "../services/storage";
import ProfileIcon from "./ProfileIcon";

const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PILL_WIDTH_PERCENT = 0.8;
const PILL_WIDTH = Dimensions.get("window").width * PILL_WIDTH_PERCENT;
const ITEM_WIDTH = 60;
const PADDING = 20;
const USABLE_WIDTH = PILL_WIDTH - 2 * PADDING;
const GAP = (USABLE_WIDTH - 4 * ITEM_WIDTH) / 5;

const TAB_CENTERS = [
  PADDING + GAP + ITEM_WIDTH / 2,
  PADDING + 2 * GAP + 1.5 * ITEM_WIDTH,
  PADDING + 3 * GAP + 2.5 * ITEM_WIDTH,
  PADDING + 4 * GAP + 3.5 * ITEM_WIDTH,
];

function TabItem({ route, isFocused, onPress, role, userPhotoUrl }: any) {
  const animatedValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [isFocused]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, -30],
  });

  const iconContainerBackground = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", "white"],
  });

  // 1. Determine which icon asset or component to use
  let icon;

  if (route.name === "Home") {
    icon = require("../app-assets/mentoring-icon.svg");
  } else if (route.name === "Chat") {
    icon = require("../app-assets/chat-round.svg");
  } else if (route.name === "Ask") {
    icon = require("../app-assets/mentor-ask.svg");
  }

  let title = "";
  if (route.name === "Home") {
    title = "Home";
  } else if (route.name === "Chat") {
    title = "Messages";
  } else if (route.name === "Ask") {
    title = role === "mentor" ? "Guide" : "Ask";
  } else if (route.name === "Profile") {
    title = "Profile";
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      style={tabStyles.tabItem}
    >
      <Animated.View
        style={[
          tabStyles.animatedWrapper,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <Animated.View
          style={[
            tabStyles.activeCircle,
            {
              backgroundColor: "transparent",
            },
          ]}
        />
        <Animated.View
          style={[
            tabStyles.iconContainer,
            {
              backgroundColor: iconContainerBackground,
              elevation: isFocused ? 4 : 0,
              shadowOpacity: isFocused ? 0.25 : 0,
            },
          ]}
        >
          {/* 2. Handle the Profile route rendering cleanly */}
          {route.name === "Profile" ? (
            userPhotoUrl ? (
              // If user has uploaded a photo, render the image inside the tab circle
              <AnimatedImage
                source={{ uri: userPhotoUrl }}
                style={[
                  tabStyles.icon,
                  tabStyles.profileImage,
                  {
                    borderRadius: 20,
                    borderWidth: isFocused ? 2 : 0,
                    borderColor: "#0077CB"
                  }
                ]}
                contentFit="cover"
              />
            ) : (
              // Fallback to our custom SVG component if no photo is uploaded
              <ProfileIcon color={isFocused ? "#0077CB" : "#ffffff"} size={26} />
            )
          ) : (
            // Handle all other standard SVG file assets via AnimatedImage
            <AnimatedImage
              source={icon}
              style={tabStyles.icon}
              tintColor={isFocused ? "#0077CB" : "#ffffff"}
            />
          )}
        </Animated.View>
      </Animated.View>
      <Text style={[tabStyles.tabTitle, { color: isFocused ? "#ffffff" : "rgba(255,255,255,0.6)", fontWeight: isFocused ? "bold" : "normal" }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  const [circleX, setCircleX] = React.useState(TAB_CENTERS[state.index]);
  const cutoutX = React.useRef(new Animated.Value(TAB_CENTERS[state.index])).current;
  const [role, setRole] = React.useState<string | null>(null);
  const [userPhotoUrl, setUserPhotoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const userStr = await storage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setRole(user.role || null);
          setUserPhotoUrl(user.photo_url || null);
        }
        const storedRole = await storage.getItem("role");
        if (storedRole && !role) {
          setRole(storedRole);
        }
      } catch (err) {
        console.error("Failed to load user data for tab bar:", err);
      }
    };
    loadUserData();
  }, []);

  React.useEffect(() => {
    const listenerId = cutoutX.addListener(({ value }) => setCircleX(value));
    Animated.spring(cutoutX, {
      toValue: TAB_CENTERS[state.index],
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
    return () => cutoutX.removeListener(listenerId);
  }, [state.index]);

  return (
    <View style={tabStyles.container}>
      <View style={tabStyles.pillBackgroundContainer}>
        <Svg width={PILL_WIDTH} height={60}>
          <Defs>
            <Mask id="pillMask">
              <Rect width={PILL_WIDTH} height={60} rx={30} ry={30} fill="white" />
              <AnimatedCircle cx={cutoutX} cy={2} r={28} fill="black" />
            </Mask>
          </Defs>
          <Rect width={PILL_WIDTH} height={60} rx={30} ry={30} fill="#0077CB" mask="url(#pillMask)" />
        </Svg>
      </View>
      <View style={tabStyles.pill}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.name}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              role={role}
              userPhotoUrl={userPhotoUrl}
            />
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
    elevation: 0,
  },
  pill: {
    flexDirection: "row",
    backgroundColor: "transparent",
    width: PILL_WIDTH,
    paddingHorizontal: 20,
    height: 60,
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  pillBackgroundContainer: {
    position: "absolute",
    width: PILL_WIDTH,
    height: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  tabTitle: {
    fontSize: 10,
    position: 'absolute',
    bottom: 4,
    width: 60,
    textAlign: 'center',
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
  },
  animatedWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
  },
  activeCircle: {
    width: 60,
    height: 30,
    marginTop: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: "absolute",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 2,
  },
  icon: {
    width: 26,
    height: 26,
  },
  profileImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});
