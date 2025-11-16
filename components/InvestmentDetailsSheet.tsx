import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type Transaction = {
	name: string;
	amount: string;
	status: string;
	priority: string;
};

type Props = {
	visible: boolean;
	onClose: () => void;
	onPaymentComplete: () => void;
	transaction: Transaction | null;
};

export default function InvestmentDetailsSheet({ visible, onClose, transaction, onPaymentComplete }: Props) {
	const screenHeight = Dimensions.get('window').height;
	const sheetHeight = Math.round(screenHeight * 0.4);
	const translateY = useRef(new Animated.Value(sheetHeight)).current;
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		if (visible) {
			setMounted(true);
			Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: false }).start();
		} else if (mounted) {
			Animated.timing(translateY, { toValue: sheetHeight, duration: 200, useNativeDriver: false }).start(({ finished }) => {
				if (finished) setMounted(false);
			});
		}
	}, [visible, mounted, sheetHeight, translateY]);

	const handleClose = () => {
		Animated.timing(translateY, { toValue: sheetHeight, duration: 200, useNativeDriver: false }).start(({ finished }) => {
			if (finished) onClose();
		});
	};

	if (!mounted) return null;

	return (
		<View pointerEvents="box-none" style={styles.absoluteOverlay}>
			<View style={styles.sheetBackdrop}>
				<TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
				<Animated.View style={[styles.sheetContainer, { height: sheetHeight, transform: [{ translateY }] }]}>
					<View style={styles.sheetHandle} />
					<Text style={styles.sheetTitle}>Investment Details</Text>
					{transaction ? (
						<View style={{ gap: 8 }}>
							<Row label="Name" value={transaction.name} />
							<Row label="Amount" value={transaction.amount} />
							<Row label='Priority' value={transaction.priority} />
							<Row label="Status" value={transaction.status} />
						</View>
					) : null}
					<View style={{ height: 16 }} />
					{transaction?.status === 'pending' && <SwipeToPayButton onComplete={onPaymentComplete} />}
				</Animated.View>
			</View>
		</View>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.row}>
			<Text style={styles.rowLabel}>{label}</Text>
			<Text style={styles.rowValue}>{value}</Text>
		</View>
	);
}

function SwipeToPayButton({ onComplete }: { onComplete: () => void }) {
	const trackWidth = useMemo(() => Dimensions.get('window').width - 48, []);
	const thumbSize = 44;
	const maxX = trackWidth - thumbSize;
	const x = useRef(new Animated.Value(0)).current;

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderMove: (_evt, gesture) => {
				const nx = Math.max(0, Math.min(maxX, gesture.dx));
				x.setValue(nx);
			},
			onPanResponderRelease: () => {
				x.stopAnimation((val: number) => {
					if (val >= maxX * 0.85) {
						Animated.timing(x, { toValue: maxX, duration: 120, useNativeDriver: false }).start(() => {
							onComplete();
							x.setValue(0);
						});
					} else {
						Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
					}
				});
			},
		}),
	).current;

	const progressWidth = x.interpolate({
		inputRange: [0, maxX],
		outputRange: [thumbSize, trackWidth],
		extrapolate: 'clamp',
	});

	return (
		<View style={[styles.swipeTrack, { width: trackWidth, height: thumbSize }]}>
			{/* Ensure this doesn't intercept touches */}
			<Animated.View pointerEvents="none" style={[styles.progressFill, { width: progressWidth }]} />
			<Text style={styles.swipeText}>Swipe to mark payment complete</Text>
			<Animated.View
				style={[styles.thumb, { width: thumbSize, height: thumbSize, transform: [{ translateX: x }], zIndex: 2 }]}
				{...panResponder.panHandlers}
			>
				<Text style={styles.thumbText}>{'>'}</Text>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	absoluteOverlay: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
	},
	sheetBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.35)',
		justifyContent: 'flex-end',
	},
	sheetContainer: {
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		padding: 16,
		gap: 8,
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		width: '100%',
	},
	sheetHandle: {
		alignSelf: 'center',
		width: 48,
		height: 4,
		borderRadius: 2,
		backgroundColor: '#E5E7EB',
		marginBottom: 8,
	},
	sheetTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 4,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 6,
	},
	rowLabel: {
		color: '#6B7280',
		fontSize: 13,
	},
	rowValue: {
		color: '#111827',
		fontWeight: '600',
		fontSize: 14,
	},
	swipeTrack: {
		backgroundColor: '#F3F4F6',
		borderRadius: 999,
		overflow: 'hidden',
		alignSelf: 'center',
		position: 'relative',
		justifyContent: 'center',
	},
	progressFill: {
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		backgroundColor: '#10B981',
		borderRadius: 999,
		elevation: 5,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 2,
	},
	swipeText: {
		textAlign: 'center',
		color: '#111827',
		fontWeight: '600',
		fontSize: 12,
	},
	thumb: {
		position: 'absolute',
		left: 0,
		top: 0,
		backgroundColor: '#FFFFFF',
		borderRadius: 999,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 2,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 2,
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	thumbText: {
		color: '#111827',
		fontSize: 18,
		fontWeight: '800',
	},
});


