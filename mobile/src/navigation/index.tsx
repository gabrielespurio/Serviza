import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';

// Telas pesadas importadas normalmente mas com lazy evaluation via Metro inline requires
import RegisterScreen from '../screens/onboarding/RegisterScreen';
import ChatOnboarding from '../screens/onboarding/ChatOnboarding';
import ContratanteNavigator from './ContratanteNavigator';
import PrestadorNavigator from './PrestadorNavigator';
import CreateJobFlow from '../screens/contratante/CreateJobFlow';
import JobProposalsScreen from '../screens/contratante/JobProposalsScreen';
import JobDetailsScreen from '../screens/prestador/JobDetailsScreen';
import ChatScreen from '../screens/ChatScreen';
import VagasScreen from '../screens/contratante/VagasScreen';
import ProfessionalProfileScreen from '../screens/contratante/ProfessionalProfileScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ChatOnboarding" component={ChatOnboarding} />
        <Stack.Screen name="MainContratante" component={ContratanteNavigator} />
        <Stack.Screen name="MainPrestador" component={PrestadorNavigator} />
        <Stack.Screen name="CreateJob" component={CreateJobFlow} options={{ presentation: 'modal' }} />
        <Stack.Screen name="JobProposals" component={JobProposalsScreen} />
        <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="Vagas" component={VagasScreen} />
        <Stack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
