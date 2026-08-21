import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeContratante from '../screens/contratante/HomeContratante';
import SearchProfissionaisScreen from '../screens/contratante/SearchProfissionaisScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { Home, Briefcase, MessageSquare, User, Plus, Search } from '../components/icons';
import { LinearGradient } from 'expo-linear-gradient';

const Tab = createBottomTabNavigator();

// Placeholder para outras telas
const PlaceholderScreen = ({ title }: { title: string }) => (
  <View className="flex-1 items-center justify-center bg-[#FAFAFA]">
    <Text className="text-[#94A3B8] font-semibold">{title}</Text>
  </View>
);

// Botão central customizado para "Criar Vaga"
function CreateJobButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        top: -22,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          overflow: 'hidden',
          ...Platform.select({
            ios: { shadowColor: '#F97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10 },
            android: { elevation: 8 },
          }),
        }}
      >
        <LinearGradient
          colors={['#FFB347', '#F97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Plus color="#FFFFFF" size={28} strokeWidth={2.8} />
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

export default function ContratanteNavigator({ navigation: rootNavigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 12,
          paddingTop: 12,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 10 },
          })
        },
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4
        }
      }}
    >
      <Tab.Screen 
        name="Início" 
        component={HomeContratante} 
        options={{ tabBarIcon: ({ color }) => <Home color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Busca" 
        component={SearchProfissionaisScreen} 
        options={{ tabBarIcon: ({ color }) => <Search color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Criar"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <CreateJobButton 
              onPress={() => rootNavigation.navigate('CreateJob')} 
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            rootNavigation.navigate('CreateJob');
          },
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={() => <PlaceholderScreen title="Mensagens" />} 
        options={{ 
          tabBarIcon: ({ color }) => (
            <View>
              <MessageSquare color={color} size={24} />
              <View className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </View>
          ) 
        }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen} 
        options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
      />
    </Tab.Navigator>
  );
}
