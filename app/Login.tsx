import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { loginWithGoogle } from '../services/appwrite/auth';
import { Chrome } from 'lucide-react-native';
import AppLogo from '../components/AppLogo';
import type { Theme } from '../theme/restyleTheme';

export default function LoginScreen() {
	const { login } = useAuth();
	const navigation = useNavigation();
	const theme = useTheme<Theme>();
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
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<View style={styles.logoWrap}>
				<AppLogo width={72} height={72} />
			</View>
			<Text style={[styles.title, { color: theme.colors.foreground }]}>Sign In</Text>
			<TextInput
				style={[
					styles.input,
					{
						borderColor: theme.colors.input,
						backgroundColor: theme.colors.muted,
						color: theme.colors.foreground,
					},
				]}
				placeholder="Email"
				placeholderTextColor={theme.colors.mutedForeground}
				autoCapitalize="none"
				keyboardType="email-address"
				value={email}
				onChangeText={setEmail}
			/>
			<TextInput
				style={[
					styles.input,
					{
						borderColor: theme.colors.input,
						backgroundColor: theme.colors.muted,
						color: theme.colors.foreground,
					},
				]}
				placeholder="Password"
				placeholderTextColor={theme.colors.mutedForeground}
				secureTextEntry
				value={password}
				onChangeText={setPassword}
			/>
			<TouchableOpacity
				style={[
					styles.primaryButton,
					{ backgroundColor: theme.colors.primary },
					submitting && { opacity: 0.6 },
				]}
				onPress={onSubmit}
				disabled={submitting}
			>
				<Text style={[styles.primaryButtonText, { color: theme.colors.primaryForeground }]}>
					Login
				</Text>
			</TouchableOpacity>

			<View style={{ height: 12 }} />
			<TouchableOpacity
				style={[
					styles.socialButton,
					{
						backgroundColor: theme.colors.card,
						borderColor: theme.colors.border,
					},
				]}
				activeOpacity={0.85}
				onPress={async () => {
					try {
						await loginWithGoogle();
					} catch (e: any) {
						showErrorToast('Google Sign-In failed', e?.message ?? 'Please try again.');
					}
				}}
			>
				<View style={styles.socialButtonContent}>
					<Chrome size={18} color="#DB4437" />
					<Text
						style={[
							styles.socialButtonText,
							{ marginLeft: 8, color: theme.colors.foreground },
						]}
					>
						Continue with Google
					</Text>
				</View>
			</TouchableOpacity>

			<TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
				<Text style={[styles.linkText, { color: theme.colors.primary }]}>
					Don't have an account? Register
				</Text>
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
	socialButtonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
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
	socialButton: {
		height: 44,
		borderRadius: 999,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	socialButtonText: { color: '#111827', fontWeight: '600', fontSize: 16 },
	linkText: { textAlign: 'center', marginTop: 16, color: '#1E40AF' },
});


