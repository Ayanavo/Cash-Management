import React, { useState, useCallback } from 'react';
import { Picker } from '@react-native-picker/picker';
import {
	AlertCircle,
	Calendar,
	DollarSign,
	FileText,
	X,
} from 'lucide-react-native';
import moment from 'moment';
import {
	Modal,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	Platform,
} from 'react-native';
import DateTimePicker, {
	DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { createInvestmentDocument } from '../services/appwrite';
import { useAuth } from '../context/AuthContext';
import { useDateFormat } from '../context/DateFormatContext';
import { emitInvestmentsChanged } from '../services/events';

type Priority = 'low' | 'medium' | 'high';
type Status = 'pending' | 'paid' | 'dismissed';

type InvestmentFormState = {
	investmentName: string;
	amount: string;
	deadline: string;
	priority: Priority;
	description: string;
	status: Status;
};

type InvestmentFormErrors = {
	investmentName: boolean;
	amount: boolean;
	deadline: boolean;
	priority: boolean;
};

type AddInvestmentModalProps = {
	visible: boolean;
	onClose: () => void;
};

const INITIAL_FORM_STATE: InvestmentFormState = {
	investmentName: '',
	amount: '',
	deadline: '',
	priority: 'low',
	description: '',
	status: 'pending',
};

// will use global date formatter instead

const formatAmountInput = (input: string) => {
	// Keep digits and at most one decimal point; limit to 2 decimals
	const cleaned = input.replace(/[^\d.]/g, '');
	const [rawInt = '0', rawDec] = cleaned.split('.');
	// Remove leading zeros before other digits (but allow single zero)
	const intPart = (rawInt.replace(/^0+(?=\d)/, '') || '0').replace(
		/\B(?=(\d{3})+(?!\d))/g,
		',',
	);
	if (typeof rawDec === 'string') {
		return `${intPart}.${rawDec.slice(0, 2)}`;
	}
	return intPart;
};

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
	visible,
	onClose,
}) => {
	const [formData, setFormData] = useState<InvestmentFormState>(
		INITIAL_FORM_STATE,
	);
	const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
	const [openDatePicker, setOpenDatePicker] = useState<boolean>(false);
	const [errors, setErrors] = useState<InvestmentFormErrors>({
		investmentName: false,
		amount: false,
		deadline: false,
		priority: false,
	});
	const { user } = useAuth();
	const { formatDate, formatString } = useDateFormat();

	const isPastDate = useCallback((date: Date) => {
		const today = new Date();
		const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
		const pickedStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
		return pickedStart < todayStart;
	}, []);

	const handleChange = useCallback(
		(name: keyof InvestmentFormState, value: string) => {
			setFormData((prev) => ({
				...prev,
				[name]: value,
			}));
			// Clear error for this field when user types/selects a value
			if (value && value.trim().length > 0) {
				setErrors((prev) => ({
					...prev,
					[name as keyof InvestmentFormErrors]: false,
				}));
			}
		},
		[],
	);

	const parseAmountToNumber = (formatted: string) => {
		const normalized = formatted.replace(/,/g, '');
		const num = Number(normalized);
		return isNaN(num) ? 0 : num;
	};

	const handleSubmit = useCallback(async () => {
		const validation: InvestmentFormErrors = {
			investmentName: formData.investmentName.trim().length === 0,
			amount: formData.amount.trim().length === 0,
			deadline: formData.deadline.trim().length === 0,
			priority: !formData.priority,
		};

		// Additional constraints
		if (formData.investmentName.trim().length > 20) {
			validation.investmentName = true;
			showErrorToast('Invalid name', 'Investment name cannot exceed 20 characters.');
		}
		// Validate deadline not in the past (parse using global format)
		if (formData.deadline) {
			const parsed = moment(formData.deadline, formatString, true);
			if (parsed.isValid() && isPastDate(parsed.toDate())) {
				validation.deadline = true;
				showErrorToast('Invalid deadline', 'Deadline cannot be in the past.');
			}
		}

		const hasErrors =
			validation.investmentName ||
			validation.amount ||
			validation.deadline ||
			validation.priority;

		if (hasErrors) {
			setErrors(validation);
			return;
		}

		try {
			const payload = {
				name: formData.investmentName,
				amount: parseAmountToNumber(formData.amount),
				deadline: formData.deadline,
				priority: formData.priority,
				description: formData.description,
				status: formData.status
			};
			await createInvestmentDocument(payload).then(res => {
				console.log(res);

			})
			emitInvestmentsChanged();
			onClose();
			showSuccessToast('Investment Created', 'Your investment details have been saved.');
			handleReset();
		} catch (e: any) {
			showErrorToast('Failed to save', e?.message ?? 'Could not save investment.');
		}
	}, [formData, onClose, user]);

	const handleReset = useCallback(() => {
		setFormData(INITIAL_FORM_STATE);
		setDeadlineDate(null);
		setOpenDatePicker(false);
		setErrors({
			investmentName: false,
			amount: false,
			deadline: false,
			priority: false,
		});
	}, []);

	const handleDateChange = useCallback(
		(event: DateTimePickerEvent, date?: Date) => {
			if (Platform.OS === 'android') {
				setOpenDatePicker(false);
				if (event.type === 'set' && date) {
					if (isPastDate(date)) {
						showErrorToast('Invalid deadline', 'Deadline cannot be in the past.');
						return;
					}
					setDeadlineDate(date);
					handleChange('deadline', formatDate(date));
					setErrors((prev) => ({ ...prev, deadline: false }));
				}
			} else {
				// iOS: inline/spinner mode – close once date is picked
				if (date) {
					if (isPastDate(date)) {
						showErrorToast('Invalid deadline', 'Deadline cannot be in the past.');
						setOpenDatePicker(false);
						return;
					}
					setDeadlineDate(date);
					handleChange('deadline', formatDate(date));
					setOpenDatePicker(false);
					setErrors((prev) => ({ ...prev, deadline: false }));
				}
			}
		},
		[handleChange],
	);

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="formSheet"
			onRequestClose={onClose}
		>
			<SafeAreaView className="flex-1 bg-white">
				{/* Header */}
				<View style={styles.headerContainer}>
					<View style={{ width: 22 }} />
					<Text style={styles.headerText}>Create Investment</Text>
					<TouchableOpacity
						onPress={onClose}
						hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
					>
						<X size={22} color="#111827" />
					</TouchableOpacity>
				</View>

				{/* Content */}
				<View style={styles.screenBody}>
					<View style={styles.container}>
						<Text style={styles.subheaderText}>
							Fill in the details below to create a new investment opportunity
						</Text>

						<View style={styles.formContainer}>
							{/* Form Fields */}
							<View style={styles.formFields}>
								{/* Investment Name Field */}
								<View style={styles.inputGroup}>
									<View style={styles.labelRow}>
										<Text style={styles.label}>Investment Name</Text>
									</View>
									<TextInput
										style={[styles.input, errors.investmentName && styles.errorInput]}
										value={formData.investmentName}
										onChangeText={(text) => handleChange('investmentName', text)}
										maxLength={20}
										placeholder="e.g., Tech Startup Fund"
										placeholderTextColor="#9CA3AF"
									/>
									<Text style={styles.charCounter}>{`${formData.investmentName.length}/20`}</Text>
								</View>

								{/* Amount Field */}
								<View style={styles.inputGroup}>
									<View style={styles.labelRow}>
										<DollarSign width={16} height={16} />
										<Text style={[styles.label, styles.labelWithIconText]}>
											Investment Amount
										</Text>
									</View>
									<TextInput
										style={[styles.input, errors.amount && styles.errorInput]}
										value={formData.amount}
										onChangeText={(text) =>
											handleChange('amount', formatAmountInput(text))
										}
										placeholder="0.00"
										placeholderTextColor="#9CA3AF"
										keyboardType="numeric"
									/>
								</View>

								{/* Deadline Field */}
								<View style={styles.inputGroup}>
									<View style={styles.labelRow}>
										<Calendar width={16} height={16} />
										<Text style={[styles.label, styles.labelWithIconText]}>
											Deadline
										</Text>
									</View>
									<TouchableOpacity
										style={[
											styles.input,
											styles.dateInput,
											errors.deadline && styles.errorInput,
										]}
										onPress={() => setOpenDatePicker(true)}
										activeOpacity={0.7}
									>
										<Text
											style={[
												styles.dateText,
												!formData.deadline && styles.datePlaceholderText,
											]}
										>
											{formData.deadline || formatString}
										</Text>
									</TouchableOpacity>
									<Text style={styles.charCounter}>Deadline cannot be in the past</Text>
								</View>

								{/* Priority Field */}
								<View style={styles.inputGroup}>
									<View style={styles.labelRow}>
										<AlertCircle width={16} height={16} />
										<Text style={[styles.label, styles.labelWithIconText]}>
											Priority Level
										</Text>
									</View>
									<View
										style={[
											styles.pickerWrapper,
											errors.priority && styles.errorInput,
										]}
									>
										<Picker
											selectedValue={formData.priority}
											onValueChange={(itemValue) =>
												handleChange('priority', itemValue)
											}
											style={styles.picker}
											itemStyle={styles.pickerItem}
											mode="dropdown"
											prompt="Select Priority"
											dropdownIconColor="#4B5563"
										>
											<Picker.Item label="Low Priority" value="low" color="#111827" />
											<Picker.Item label="Medium Priority" value="medium" color="#111827" />
											<Picker.Item label="High Priority" value="high" color="#111827" />
										</Picker>
									</View>
								</View>

								{/* Description Field */}
								<View style={styles.inputGroup}>
									<View style={styles.labelRow}>
										<FileText width={16} height={16} />
										<Text style={[styles.label, styles.labelWithIconText]}>
											Description
										</Text>
									</View>
									<TextInput
										style={[styles.input, styles.textarea]}
										value={formData.description}
										onChangeText={(text) => handleChange('description', text)}
										placeholder="Add a description for this investment"
										placeholderTextColor="#9CA3AF"
										multiline
										numberOfLines={4}
										maxLength={100}
									/>
									<Text style={styles.charCounter}>{`${formData.description.length}/100`}</Text>
								</View>
							</View>

							{/* Form Actions pinned towards bottom */}
							<View style={styles.actions}>
								<TouchableOpacity
									style={styles.primaryButton}
									onPress={handleSubmit}
									activeOpacity={0.85}
								>
									<Text style={styles.primaryButtonText}>Create Investment</Text>
								</TouchableOpacity>

								<TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
									<Text style={styles.clearButton}>Clear</Text>
								</TouchableOpacity>
							</View>

							{openDatePicker && (
								<DateTimePicker
									value={deadlineDate ?? new Date()}
									mode="date"
									display={Platform.OS === 'ios' ? 'spinner' : 'default'}
									minimumDate={new Date(new Date().setHours(0, 0, 0, 0))}
									onChange={handleDateChange}
								/>
							)}
						</View>

					</View>
				</View>
			</SafeAreaView>
		</Modal>
	);
};

export default AddInvestmentModal;

const styles = StyleSheet.create({
	screenBody: {
		flex: 1,
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	container: {
		flex: 1,
		paddingVertical: 16,
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
	},
	formContainer: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	formFields: {
		flexGrow: 1,
	},
	inputGroup: {
		marginBottom: 16,
	},
	headerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	headerText: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
	},
	subheaderText: {
		color: '#4B5563',
		marginBottom: 24,
		fontSize: 14,
	},
	labelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#4B5563',
	},
	labelWithIconText: {
		marginLeft: 6,
	},
	input: {
		height: 40,
		borderColor: '#D1D5DB',
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 10,
		fontSize: 16,
		backgroundColor: '#F9FAFB',
	},
	textarea: {
		textAlignVertical: 'top',
		minHeight: 100,
		paddingVertical: 10,
	},
	dateInput: {
		justifyContent: 'center',
	},
	dateText: {
		fontSize: 16,
		color: '#111827',
	},
	datePlaceholderText: {
		color: '#9CA3AF',
	},
	pickerWrapper: {
		borderColor: '#D1D5DB',
		borderWidth: 1,
		borderRadius: 8,
		backgroundColor: '#F9FAFB',
		// overflow: 'hidden',
	},
	picker: {
		height: 40,
		width: '100%',
	},
	pickerItem: {
		color: '#111827',
		fontSize: 16,
	},
	actions: {
		marginTop: 24,
		paddingBottom: 8,
	},
	primaryButton: {
		height: 44,
		borderRadius: 999,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#111827',
	},
	primaryButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
	},
	clearButton: {
		color: '#1E40AF',
		textAlign: 'center',
		marginTop: 10,
		fontSize: 16,
	},
	errorInput: {
		borderColor: '#EF4444',
		borderWidth: 2,
	},
	charCounter: {
		color: '#6B7280',
		fontSize: 12,
		textAlign: 'right',
		marginTop: 4,
	}
});
