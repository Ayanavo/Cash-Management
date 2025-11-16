import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen() {
	const { register } = useAuth();
	const navigation = useNavigation();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const onSubmit = async () => {
		if (!name || !email || !password) {
			showErrorToast('Missing fields', 'Please fill all fields.');
		 return;
		}
		setSubmitting(true);
		const res = await register(name, email, password);
		if (res.ok) {
			showSuccessToast('Account created', res.message);
		} else {
			showErrorToast('Registration failed', res.message);
		}
		setSubmitting(false);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Create Account</Text>
			<TextInput
				style={styles.input}
				placeholder="Name"
				placeholderTextColor="#9CA3AF"
				value={name}
				onChangeText={setName}
			/>
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
				<Text style={styles.primaryButtonText}>Register</Text>
			</TouchableOpacity>

			<TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
				<Text style={styles.linkText}>Already have an account? Login</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 16, justifyContent: 'center', backgroundColor: '#fff' },
	title: { fontSize: 24, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
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


