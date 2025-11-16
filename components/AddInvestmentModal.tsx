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
import { showSuccessToast } from '../utils/toast';

type Priority = 'low' | 'medium' | 'high';

type InvestmentFormState = {
	investmentName: string;
	amount: string;
	deadline: string;
	priority: Priority;
	description: string;
};

type AddInvestmentModalProps = {
	visible: boolean;
	onClose: () => void;
};

const INITIAL_FORM_STATE: InvestmentFormState = {
	investmentName: '',
	amount: '',
	deadline: '',
	priority: 'medium',
	description: '',
};

const formatDate = (date: Date) => moment(date).format('YYYY-MM-DD');

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
	visible,
	onClose,
}) => {
	const [formData, setFormData] = useState<InvestmentFormState>(
		INITIAL_FORM_STATE,
	);
	const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
	const [openDatePicker, setOpenDatePicker] = useState<boolean>(false);

	const handleChange = useCallback(
		(name: keyof InvestmentFormState, value: string) => {
			setFormData((prev) => ({
				...prev,
				[name]: value,
			}));
		},
		[],
	);

	const handleSubmit = useCallback(() => {
		console.log('Investment details:', formData);
		onClose();
		showSuccessToast(
			'Investment Created',
			'Your investment details have been saved.',
		);
	}, [formData, onClose]);

	const handleReset = useCallback(() => {
		setFormData(INITIAL_FORM_STATE);
		setDeadlineDate(null);
		setOpenDatePicker(false);
	}, []);

	const handleDateChange = useCallback(
		(event: DateTimePickerEvent, date?: Date) => {
			if (Platform.OS === 'android') {
				setOpenDatePicker(false);
				if (event.type === 'set' && date) {
					setDeadlineDate(date);
					handleChange('deadline', formatDate(date));
				}
			} else {
				// iOS: inline/spinner mode – close once date is picked
				if (date) {
					setDeadlineDate(date);
					handleChange('deadline', formatDate(date));
					setOpenDatePicker(false);
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
										style={styles.input}
										value={formData.investmentName}
										onChangeText={(text) => handleChange('investmentName', text)}
										placeholder="e.g., Tech Startup Fund"
										placeholderTextColor="#9CA3AF"
									/>
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
										style={styles.input}
										value={formData.amount}
										onChangeText={(text) => handleChange('amount', text)}
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
										style={[styles.input, styles.dateInput]}
										onPress={() => setOpenDatePicker(true)}
										activeOpacity={0.7}
									>
										<Text
											style={[
												styles.dateText,
												!formData.deadline && styles.datePlaceholderText,
											]}
										>
											{formData.deadline || 'YYYY-MM-DD'}
										</Text>
									</TouchableOpacity>
								</View>

								{/* Priority Field */}
								<View style={styles.inputGroup}>
									<View style={styles.labelRow}>
										<AlertCircle width={16} height={16} />
										<Text style={[styles.label, styles.labelWithIconText]}>
											Priority Level
										</Text>
									</View>
									<View style={styles.pickerWrapper}>
										<Picker
											selectedValue={formData.priority}
											onValueChange={(itemValue) =>
												handleChange('priority', itemValue)
											}
											style={styles.picker}
											dropdownIconColor="#4B5563"
										>
											<Picker.Item label="Low Priority" value="low" />
											<Picker.Item label="Medium Priority" value="medium" />
											<Picker.Item label="High Priority" value="high" />
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
										placeholder="Provide details about this investment opportunity..."
										placeholderTextColor="#9CA3AF"
										multiline
										numberOfLines={4}
									/>
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
		overflow: 'hidden',
	},
	picker: {
		height: 40,
		width: '100%',
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
});
