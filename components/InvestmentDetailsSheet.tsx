import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Animated,
	Dimensions,
	Modal,
	PanResponder,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import {
	AlertTriangle,
	BadgeAlert,
	Ban,
	CheckCircle2,
	ChevronsRight,
	CircleAlert,
	TriangleAlert,
	Trash,
	X,
} from 'lucide-react-native';
import {
	BottomSheetBackdrop,
	BottomSheetModal,
	BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	listInvestmentDocuments,
	deleteInvestmentDocument,
	updateInvestmentStatus,
} from '../services/appwrite/investments';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { emitInvestmentsChanged } from '../services/events';
import type { InvestmentDetailsSheetProps } from '../interfaces/components.types';
import type { Theme } from '../theme/restyleTheme';

const InvestmentDetailsSheet = forwardRef<
	BottomSheetModal,
	InvestmentDetailsSheetProps
>(function InvestmentDetailsSheet(
	{ onClose, transaction, onPaymentComplete, balanceExpense = 0, readOnly = false },
	ref,
) {
	const theme = useTheme<Theme>();
	const insets = useSafeAreaInsets();
	const [confirmVisible, setConfirmVisible] = useState(false);
	const actionsEnabled = !readOnly;

	const renderBackdrop = useCallback(
		(backdropProps: any) => (
			<BottomSheetBackdrop
				{...backdropProps}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
				pressBehavior="close"
			/>
		),
		[],
	);

	const isPending = (transaction?.status ?? '').toString().toLowerCase() === 'pending';

	const priorityRaw = (transaction?.priority ?? '').toString().toLowerCase();
	let PriorityIcon: typeof BadgeAlert | typeof CircleAlert | typeof TriangleAlert = BadgeAlert;
	let priorityColor: string = theme.colors.success;
	let priorityLabel = 'Low';

	if (priorityRaw === 'medium') {
		PriorityIcon = CircleAlert;
		priorityColor = theme.colors.warning;
		priorityLabel = 'Medium';
	} else if (priorityRaw === 'high') {
		PriorityIcon = TriangleAlert;
		priorityColor = theme.colors.destructive;
		priorityLabel = 'High';
	}

	const statusRaw = (transaction?.status ?? '').toString().toLowerCase();
	let statusBg: string = theme.colors.muted;
	let statusTextColor: string = theme.colors.foreground;

	if (statusRaw === 'paid') {
		statusBg = theme.colors.successSoft;
		statusTextColor = theme.colors.success;
	} else if (statusRaw === 'pending') {
		statusBg = theme.colors.warningSoft;
		statusTextColor = theme.colors.warning;
	} else if (statusRaw === 'dismissed') {
		statusBg = theme.colors.red100;
		statusTextColor = theme.colors.destructive;
	}

	return (
		<>
			<BottomSheetModal
				ref={ref}
				snapPoints={[isPending ? '60%' : '40%']}
				backdropComponent={renderBackdrop}
				backgroundStyle={{ backgroundColor: theme.colors.card }}
				handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
			>
				<BottomSheetView
					style={[
						styles.sheetContainer,
						{
							backgroundColor: theme.colors.card,
							paddingBottom: styles.sheetContainer.padding + insets.bottom,
						},
					]}
				>
					<Text style={[styles.sheetTitle, { color: theme.colors.foreground }]}>
						Investment Details
					</Text>

					{transaction ? (
						<View style={{ gap: 8 }}>
							<Row label="Name" value={transaction.name} />
							<Row label="Amount" value={transaction.amount} />
					
							<View style={styles.row}>
								<Text
									style={[
										styles.rowLabel,
										{ color: theme.colors.mutedForeground },
									]}
								>
									Priority
								</Text>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: 6,
									}}
								>
									<PriorityIcon width={16} height={16} color={priorityColor} />
									<Text
										style={[
											styles.rowValue,
											{ color: priorityColor },
										]}
									>
										{priorityLabel}
									</Text>
								</View>
							</View>

							<View style={styles.row}>
								<Text
									style={[
										styles.rowLabel,
										{ color: theme.colors.mutedForeground },
									]}
								>
									Status
								</Text>
								<View
									style={[
										styles.statusBadge,
										{
											paddingHorizontal: 12,
											paddingVertical: 4,
											borderRadius: 9999,
											backgroundColor: statusBg,
										},
									]}
								>
									<Text
										style={{
											fontSize: 12,
											fontWeight: '600',
											color: statusTextColor,
										}}
									>
										{statusRaw
											? statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1)
											: 'Pending'}
									</Text>
									
								</View>
							</View>
							{transaction?.description && (
								<View style={styles.descriptionRow}>
									<Text
										style={[
											styles.rowLabel,
											{ color: theme.colors.mutedForeground },
										]}
									>
										Description
									</Text>
									<Text
										style={[
											styles.rowValue,
											{ color: theme.colors.foreground, marginTop: 2 },
										]}
										numberOfLines={5}
										ellipsizeMode="tail"
									>
										{transaction.description}
									</Text>
								</View>
							)}
						</View>
					) : null}

					<View style={{ height: 16 }} />

					{actionsEnabled && isPending && (
						<SwipeToPayButton
							onComplete={async () => {
								if (!transaction) return;
								const amountNum = (() => {
									const normalized = String(transaction.amount).replace(/[^\d.]/g, '');
									const n = Number(normalized);
									return Number.isNaN(n) ? 0 : n;
								})();

								try {
									const docs = await listInvestmentDocuments();
									const pendingTotal = docs.reduce((acc: number, d: any) => {
										const status = String(d.status ?? '').toLowerCase();
										const n = Number(d.amount ?? 0);
										if (status === 'pending' && !Number.isNaN(n)) {
											return acc + n;
										}
										return acc;
									}, 0);

									if (amountNum + pendingTotal >= balanceExpense) {
										showErrorToast(
											'Cannot complete payment',
											'Total expense exceeds available balance.',
										);
										return;
									}
								} catch {
									showErrorToast(
										'Validation failed',
										'Could not verify available balance.',
									);
									return;
								}

								await onPaymentComplete();
							}}
							onAfterSuccess={async () => {
								if (onClose) {
									onClose();
								}
							}}
						/>
					)}

					<View style={{ height: 12 }} />

					{/* Disable & Delete actions */}
					{actionsEnabled && (
						<View style={styles.actionsWrapper}>
							<TouchableOpacity
								onPress={async () => {
									try {
										if (!transaction?.id) {
											showErrorToast(
												'Update failed',
												'Missing investment identifier.',
											);
											return;
										}

										const isDismissed = statusRaw === 'dismissed';
										const nextStatus = isDismissed ? 'pending' : 'dismissed';

										await updateInvestmentStatus(transaction.id, nextStatus);
										emitInvestmentsChanged();
										showSuccessToast(
											isDismissed ? 'Enabled' : 'Disabled',
											isDismissed
												? 'Investment has been re-enabled.'
												: 'Investment has been dismissed.',
										);
										if (onClose) {
											onClose();
										}
									} catch (e: any) {
										showErrorToast(
											'Update failed',
											e?.message ?? 'Could not update investment.',
										);
									}
								}}
								activeOpacity={0.85}
								style={[styles.actionButton, styles.disableButton]}
							>
								<View style={styles.actionButtonContent}>
									{statusRaw === 'dismissed' ? (
										<CheckCircle2 size={18} color="#6B7280" />
									) : (
										<Ban size={18} color="#6B7280" />
									)}
									<Text style={[styles.disableButtonText, { marginLeft: 6 }]}>
										{statusRaw === 'dismissed'
											? 'Enable investment'
											: 'Disable investment'}
									</Text>
								</View>
							</TouchableOpacity>

							<View
								style={[
									styles.actionSeparator,
									{ backgroundColor: theme.colors.border },
								]}
							/>

							<TouchableOpacity
								onPress={() => setConfirmVisible(true)}
								activeOpacity={0.85}
								style={[styles.actionButton, styles.deleteButton]}
							>
								<View style={styles.actionButtonContent}>
									<Trash size={18} color="#DC2626" />
									<Text style={[styles.deleteButtonText, { marginLeft: 6 }]}>
										Delete investment
									</Text>
								</View>
							</TouchableOpacity>
						</View>
					)}
				</BottomSheetView>
			</BottomSheetModal>

			{/* Confirm Delete Modal */}
			<Modal
				visible={confirmVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setConfirmVisible(false)}
			>
				<View style={styles.confirmOverlay}>
					<View
						style={[
							styles.confirmCard,
							{
								backgroundColor: theme.colors.card,
								borderColor: theme.colors.border,
							},
						]}
					>
						<View style={{ alignItems: 'center', marginBottom: 8 }}>
							<AlertTriangle size={36} color={theme.colors.destructive} />
						</View>
						<Text
							style={[styles.confirmTitle, { color: theme.colors.foreground }]}
						>
							Delete this investment?
						</Text>
						<Text
							style={[
								styles.confirmBody,
								{ color: theme.colors.mutedForeground },
							]}
						>
							This action will permanently remove the investment. This cannot be
							undone.
						</Text>
						<View style={styles.confirmActions}>
							<TouchableOpacity
								onPress={() => setConfirmVisible(false)}
								activeOpacity={0.85}
								style={[
									styles.confirmBtn,
									styles.confirmSecondary,
									{
										borderColor: theme.colors.border,
										backgroundColor: theme.colors.card,
									},
								]}
							>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<X size={16} color={theme.colors.mutedForeground} />
									<Text
										style={[
											styles.confirmSecondaryText,
											{ marginLeft: 6, color: theme.colors.foreground },
										]}
									>
										Cancel
									</Text>
								</View>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={async () => {
									try {
										if (!transaction?.id) {
											showErrorToast(
												'Delete failed',
												'Missing investment identifier.',
											);
											setConfirmVisible(false);
											return;
										}
										await deleteInvestmentDocument(transaction.id);
										emitInvestmentsChanged();
										showSuccessToast('Deleted', 'Investment removed.');
										setConfirmVisible(false);
										if (onClose) {
											onClose();
										}
									} catch (e: any) {
										showErrorToast(
											'Delete failed',
											e?.message ?? 'Could not delete investment.',
										);
									}
								}}
								activeOpacity={0.85}
								style={[
									styles.confirmBtn,
									styles.confirmDanger,
									{ backgroundColor: theme.colors.destructive },
								]}
							>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Trash
										size={16}
										color={theme.colors.destructiveForeground}
									/>
									<Text
										style={[
											styles.confirmDangerText,
											{
												marginLeft: 6,
												color: theme.colors.destructiveForeground,
											},
										]}
									>
										Delete
									</Text>
								</View>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</>
	);
});

function Row({ label, value }: { label: string; value?: string }) {
	const theme = useTheme<Theme>();
	return (
		<View style={styles.row}>
			<Text style={[styles.rowLabel, { color: theme.colors.mutedForeground }]}>
				{label}
			</Text>
			<Text
				style={[styles.rowValue, { color: theme.colors.foreground }]}
				numberOfLines={5}
				ellipsizeMode="tail"
			>
				{value}
			</Text>
		</View>
	);
}

function SwipeToPayButton({
	onComplete,
	onAfterSuccess,
}: {
	onComplete?: () => void | Promise<void>;
	onAfterSuccess?: () => void | Promise<void>;
}) {
	const theme = useTheme<Theme>();
	const trackWidth = useMemo(() => Dimensions.get('window').width - 48, []);
	const thumbSize = 44;
	const maxX = trackWidth - thumbSize;
	const x = useRef(new Animated.Value(0)).current;
	const lastX = useRef(0);
	const [isTextOnFill, setIsTextOnFill] = useState(false);

	useEffect(() => {
		const listenerId = x.addListener(({ value }) => {
			const onFill = value >= maxX * 0.2;
			setIsTextOnFill(prev => (prev === onFill ? prev : onFill));
		});

		return () => {
			x.removeListener(listenerId);
		};
	}, [x, maxX]);

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderMove: (_evt, gesture) => {
				const nx = Math.max(0, Math.min(maxX, gesture.dx));
				lastX.current = nx;
				x.setValue(nx);
			},
			onPanResponderRelease: () => {
				const val = lastX.current;
				if (val >= maxX * 0.85) {
					// Animate thumb to the end and keep it there while the payment completes
					Animated.timing(x, {
						toValue: maxX,
						duration: 120,
						useNativeDriver: false,
					}).start(() => {
						lastX.current = maxX;

						const runCompletion = async () => {
							try {
								if (onComplete) {
									await onComplete();
								}

								// After successful completion, animate back to the start
								Animated.spring(x, {
									toValue: 0,
									useNativeDriver: false,
								}).start(async () => {
									lastX.current = 0;
									if (onAfterSuccess) {
										await onAfterSuccess();
									}
								});
							} catch {
								// If something fails, reset so the user can try again
								Animated.spring(x, {
									toValue: 0,
									useNativeDriver: false,
								}).start(() => {
									lastX.current = 0;
								});
							}
						};

						// Fire and forget; the async work is handled above
						runCompletion();
					});
				} else {
					Animated.spring(x, {
						toValue: 0,
						useNativeDriver: false,
					}).start(() => {
						lastX.current = 0;
					});
				}
			},
		}),
	).current;

	const progressWidth = x.interpolate({
		inputRange: [0, maxX],
		outputRange: [thumbSize, trackWidth],
		extrapolate: 'clamp',
	});

	return (
		<View
			style={[
				styles.swipeTrack,
				{
					width: trackWidth,
					height: thumbSize,
					backgroundColor: theme.colors.muted,
				},
			]}
		>
			{/* progress fill */}
			<Animated.View
				pointerEvents="none"
				style={[
					styles.progressFill,
					{ width: progressWidth, backgroundColor: theme.colors.success },
				]}
			/>
			<Text
				style={[
					styles.swipeText,
					{
						color: isTextOnFill ? '#FFFFFF' : theme.colors.foreground,
					},
				]}
			>
				Swipe to mark payment complete
			</Text>
			<Animated.View
				style={[
					styles.thumb,
					{
						width: thumbSize,
						height: thumbSize,
						transform: [{ translateX: x }],
						backgroundColor: theme.colors.card,
						borderColor: theme.colors.border,
					},
				]}
				{...panResponder.panHandlers}
			>
				<ChevronsRight size={20} color={theme.colors.foreground} />
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	sheetContainer: {
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		padding: 16,
		gap: 8,
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
	actionButton: {
		height: 44,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: 0,
		flex: 1,
	},
	disableButton: {
		backgroundColor: 'transparent',
		marginBottom: 8,
	},
	deleteButton: {
		backgroundColor: 'transparent',
	},
	disableButtonText: {
		color: '#6B7280',
		fontSize: 12,
		fontWeight: '600',
	},
	deleteButtonText: {
		color: '#ed3939',
		fontSize: 12,
		fontWeight: '700',
	},
	actionButtonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	actionSeparator: {
		width: 2,
		height: 32,
		alignSelf: 'center',
		marginHorizontal: 20,
	},
	actionsWrapper: {
		alignSelf: 'center',
		width: '100%',
		paddingHorizontal: 15,
		flexDirection: 'row',
	},
	descriptionRow: {
		fontSize: 13,
		fontWeight: '600',
		paddingVertical: 6,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 6,
	},
	statusBadge: {
		marginLeft: 12,
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
		borderRadius: 15,
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
		borderRadius: 15,
		elevation: 5,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 2,
	},
	swipeText: {
		textAlign: 'center',
		fontWeight: '600',
		fontSize: 14,
		opacity: 0.8,
	},
	thumb: {
		position: 'absolute',
		left: 0,
		top: 0,
		borderRadius: 15,
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
	confirmOverlay: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(0,0,0,0.35)',
	},
	confirmCard: {
		width: '88%',
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	confirmTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#111827',
		textAlign: 'center',
		marginBottom: 6,
	},
	confirmBody: {
		color: '#6B7280',
		textAlign: 'center',
		fontSize: 14,
		marginBottom: 10,
	},
	confirmActions: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	confirmBtn: {
		flex: 1,
		height: 44,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	confirmSecondary: {
		borderWidth: 1,
		borderColor: '#D1D5DB',
		marginRight: 8,
		backgroundColor: '#FFFFFF',
	},
	confirmSecondaryText: {
		color: '#374151',
		fontWeight: '600',
	},
	confirmDanger: {
		backgroundColor: '#DC2626',
		marginLeft: 8,
	},
	confirmDangerText: {
		color: '#FFFFFF',
		fontWeight: '700',
	},
});

export default InvestmentDetailsSheet;
