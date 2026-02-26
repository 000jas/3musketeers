import { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [mobileFocused, setMobileFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  return (
    <LinearGradient
      colors={["#d4fc79", "#96e6a1"]}
      style={styles.background}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <Text style={styles.logo}>🌾 AgriChain</Text>
          <Text style={styles.subtitle}>Smart Farm-to-Market Intelligence</Text>

          <TextInput
            style={[
              styles.input,
              mobileFocused && styles.inputFocused,
            ]}
            placeholder="Mobile Number"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
            onFocus={() => setMobileFocused(true)}
            onBlur={() => setMobileFocused(false)}
          />
          <TextInput
            style={[
              styles.input,
              passwordFocused && styles.inputFocused,
            ]}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
          />

          <TouchableOpacity style={styles.loginButton} activeOpacity={0.8}>
            <LinearGradient
              colors={["#43a047", "#2e7d32"]}
              style={styles.loginGradient}
            >
              <Text style={styles.loginText}>Log In</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.linksContainer}>
            <Text style={styles.link}>Forgot Password?</Text>
            <Text style={styles.link}>New farmer? Register</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safe: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  inputFocused: {
    borderColor: '#43a047',
    shadowColor: '#43a047',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButton: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  loginGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linksContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  link: {
    color: '#43a047',
    marginTop: 6,
    fontSize: 14,
  },
});
