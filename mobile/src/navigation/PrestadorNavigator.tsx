import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, MessageSquare, User } from '../components/icons';
import HomePrestador from '../screens/prestador/HomePrestador';
import SearchJobsScreen from '../screens/prestador/SearchJobsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatListScreen from '../screens/ChatListScreen';

const Tab = createBottomTabNavigator();

export default function PrestadorNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
          height: 66,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FF7A2F',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 11.5,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen 
        name="Início" 
        component={HomePrestador} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={22} strokeWidth={2.4} />
        }}
      />
      <Tab.Screen 
        name="Busca" 
        component={SearchJobsScreen} 
        options={{
          tabBarLabel: 'Buscar',
          tabBarIcon: ({ color, size }) => <Search color={color} size={22} strokeWidth={2.4} />
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatListScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={22} strokeWidth={2.4} />
        }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={22} strokeWidth={2.4} />
        }}
      />
    </Tab.Navigator>
  );
}
