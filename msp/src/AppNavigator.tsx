import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ActivityIndicator, View } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import { Routes } from './Constants/Routes'
import { Colors } from './Constants/Colors'
import { useAuth } from './hooks/useAuth'
import { RootStackParamList } from './types/navigation'

import Login from './Screens/Login/Login'
import Home from './Screens/Home/Home'
import EnquiriesList from './Screens/Enquiries/EnquiriesList'
import EnquiryDetail from './Screens/Enquiries/EnquiryDetail'
import JobTrackerScreen from './Screens/JobTracker/JobTrackerScreen'
import AddJobScreen from './Screens/JobTracker/AddJobScreen'
import JobAlertsScreen from './Screens/JobAlerts/JobAlertsScreen'
import OpportunitiesScreen from './Screens/Opportunities/OpportunitiesScreen'
import SettingsScreen from './Screens/Settings/SettingsScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.Dashboard} component={Home} />
      <Stack.Screen name={Routes.Opportunities} component={OpportunitiesScreen} />
    </Stack.Navigator>
  )
}

function JobsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.JobTracker} component={JobTrackerScreen} />
      <Stack.Screen name={Routes.AddJob} component={AddJobScreen} />
    </Stack.Navigator>
  )
}

function AlertsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.JobAlerts} component={JobAlertsScreen} />
    </Stack.Navigator>
  )
}

function EnquiriesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.Enquiries} component={EnquiriesList} />
      <Stack.Screen name={Routes.EnquiryDetail} component={EnquiryDetail} />
    </Stack.Navigator>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.Login} component={Login} />
    </Stack.Navigator>
  )
}

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="JobsTab"
        component={JobsStack}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'briefcase' : 'briefcase-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={AlertsStack}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'notifications' : 'notifications-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EnquiriesTab"
        component={EnquiriesStack}
        options={{
          tabBarLabel: 'Enquiries',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'mail' : 'mail-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return user ? <BottomTabNavigator /> : <AuthStack />
}
