import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';

export default function LoginScreen() {
	const { login } = useAuth();
	const navigation = useNavigation();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const onSubmit = async () => {
		if (!email || !password) {
			showErrorToast('Missing fields', 'Please enter email and password.');
			return;
		}
		setSubmitting(true);
		const res = await login(email, password);
		if (res.ok) {
			showSuccessToast('Welcome back!', res.message);
		} else {
			showErrorToast('Login failed', res.message);
		}
		setSubmitting(false);
	};

	return (
		<View style={styles.container}>
			<View style={styles.logoWrap}>
				<AppLogo width={72} height={72} />
			</View>
			<Text style={styles.title}>Sign In</Text>
			<TextInput
				style={styles.input}
				placeholder="Email"
				placeholderTextColor="#9CA3AF"
				autoCapitalize="none"
				keyboardType="email-address"
				value={email}
				onChangeText={setEmail}
			/>
			<TextInput
				style={styles.input}
				placeholder="Password"
				placeholderTextColor="#9CA3AF"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
			/>
			<TouchableOpacity style={[styles.primaryButton, submitting && { opacity: 0.6 }]} onPress={onSubmit} disabled={submitting}>
				<Text style={styles.primaryButtonText}>Login</Text>
			</TouchableOpacity>

			<TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
				<Text style={styles.linkText}>Don't have an account? Register</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 16, justifyContent: 'center', backgroundColor: '#fff' },
	title: { fontSize: 24, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
	logoWrap: { alignItems: 'center', marginBottom: 8 },
	input: {
		height: 44,
		borderColor: '#D1D5DB',
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		backgroundColor: '#F9FAFB',
		marginBottom: 12,
	},
	primaryButton: {
		height: 44,
		borderRadius: 999,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#111827',
		marginTop: 8,
	},
	primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
	linkText: { textAlign: 'center', marginTop: 16, color: '#1E40AF' },
});


