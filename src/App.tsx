import React from "react";
import './components/bufferFill'
import { Providers } from "../src/components/Providers";

import { registerRootComponent } from "expo";
import { RecoilRoot } from "recoil";

import { HomeScreen } from "./screens/HomeScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { SwapBonkers } from "./screens/SwapBonkers";
import { SwapBoourns } from "./screens/SwapBoourns";
import { HailHydra } from './screens/HailHydra';
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Providers>
    <Tab.Navigator
      initialRouteName="Play"
      screenOptions={{
        tabBarActiveTintColor: "#e91e63",
      }} 
    >
      <Tab.Screen
        name="Play"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Play",
         
        }}
      />
      <Tab.Screen
        name="SwapBonkers"
        component={SwapBonkers}
        options={{
          tabBarLabel: "SwapBonkers",
       
        }}
      />
      <Tab.Screen
        name="SwapBoourns"
        component={SwapBoourns}
        options={{
          tabBarLabel: "SwapBoourns",
       
        }}
      />
      <Tab.Screen
        name="HailHydra"
        component={HailHydra}
        options={{
          tabBarLabel: "HailHydra",
         
        }}
      />
    </Tab.Navigator>
    </Providers>
  );
}

function App() {



  return (
    <RecoilRoot>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </RecoilRoot>
  );
}

export default registerRootComponent(App);
