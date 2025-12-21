import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@shopify/restyle';
import {
  AlertCircle,
  BadgeAlert,
  Calendar,
  CircleAlert,
  DollarSign,
  FileText,
  TriangleAlert,
  X,
} from 'lucide-react-native';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useDateFormat } from '../context/DateFormatContext';
import type {
  AddInvestmentModalProps,
  DropdownOption,
  InvestmentFormState,
  Priority,
} from '../interfaces/components.types';
import { createInvestmentDocument } from '../services/appwrite/investments';
import { emitInvestmentsChanged } from '../services/events';
import type { Theme } from '../theme/restyleTheme';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import DropdownSelect from './DropdownSelect';
import { z } from 'zod';
import type { FC } from 'react';
import RecurringEventsSection from './RecurringEventsSection';

const INITIAL_FORM_STATE: InvestmentFormState = {
  investmentName: '',
  amount: '',
  deadline: '',
  priority: 'low',
  description: '',
  status: 'pending',
  isRecurring: false,
  recurringEveryValue: '1',
  recurringEveryUnit: 'M',
};

// Format amount as "1,234.56" while typing
const formatAmountInput = (input: string) => {
  // Allow the field to be visually empty; numeric default is handled separately
  if (!input.trim()) {
    return '';
  }
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

const parseAmountToNumber = (formatted: string) => {
  const normalized = formatted.replace(/,/g, '');
  const num = Number(normalized);
  return Number.isNaN(num) ? 0 : num;
};

const investmentFormSchema = z.object({
  investmentName: z
    .string()
    .trim()
    .min(1, 'Investment name is required.')
    .max(20, 'Investment name cannot exceed 20 characters.'),
  amount: z
    .string()
    .trim()
    .min(1, 'Investment amount is required.')
    .refine(
      (val) => {
        const numeric = parseAmountToNumber(val);
        return numeric > 0 && numeric < 1_000_000;
      },
      {
        message:
          'Investment amount must be greater than zero and less than 1,000,000.',
      },
    ),
  deadline: z.string().trim().min(1, 'Deadline is required.'),
  priority: z.enum(['low', 'medium', 'high'], {
    required_error: 'Priority is required.',
  }),
  description: z.string().max(100).optional().default(''),
  status: z.enum(['pending', 'paid', 'dismissed']).default('pending'),
  isRecurring: z.boolean().optional().default(false),
  recurringEveryValue: z.string().default('1'),
  recurringEveryUnit: z.enum(['D', 'M']).default('M'),
});

const AddInvestmentModal: FC<AddInvestmentModalProps> = ({
  visible,
  onClose,
}) => {
  const theme = useTheme<Theme>();
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(new Date());
  const [openDatePicker, setOpenDatePicker] = useState<boolean>(false);

  const { user } = useAuth();
  const { formatDate, formatString } = useDateFormat();

  const {
    watch,
    setValue,
    handleSubmit: rhfHandleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<InvestmentFormState>({
    defaultValues: {
      ...INITIAL_FORM_STATE,
      // Set deadline default to the current date (formatted according to user’s date format)
      deadline: formatDate(new Date()),
    },
    resolver: zodResolver(investmentFormSchema),
  });

  const investmentName = watch('investmentName') ?? '';
  const amount = watch('amount') ?? '';
  const deadline = watch('deadline') ?? '';
  const priorityValue = watch('priority') ?? 'low';
  const description = watch('description') ?? '';
  const isRecurring = watch('isRecurring') ?? false;
  const recurringEveryValue = watch('recurringEveryValue') ?? '';
  const recurringEveryUnit = watch('recurringEveryUnit') ?? 'M';

  const priorityOptions: DropdownOption[] = useMemo(
    () => [
      {
        value: 'low',
        label: 'Low',
        leftIcon: (
          <BadgeAlert width={18} height={18} color={theme.colors.success} />
        ),
      },
      {
        value: 'medium',
        label: 'Medium',
        leftIcon: (
          <CircleAlert width={18} height={18} color={theme.colors.warning} />
        ),
      },
      {
        value: 'high',
        label: 'High',
        leftIcon: (
          <TriangleAlert
            width={18}
            height={18}
            color={theme.colors.destructive}
          />
        ),
      },
    ],
    [theme.colors.success, theme.colors.warning, theme.colors.destructive],
  );

  const isPastDate = useCallback((date: Date) => {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime();
    const pickedStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime();
    return pickedStart < todayStart;
  }, []);

  const handleReset = useCallback(() => {
    reset({
      ...INITIAL_FORM_STATE,
      deadline: formatDate(new Date()),
    });
    setDeadlineDate(new Date());
    setOpenDatePicker(false);
  }, [reset]);

  const onSubmit = useCallback(
    async (data: InvestmentFormState) => {
      if (!user) {
        showErrorToast(
          'Not signed in',
          'Please sign in to create a new investment.',
        );
        return;
      }

      const trimmedName = data.investmentName.trim();
      const numericAmount = parseAmountToNumber(data.amount);
      const recurringEveryNum = parseInt(data.recurringEveryValue || '0', 10);

      let hasErrors = false;

      // Additional deadline validation: cannot be in the past
      const parsedDeadline = moment(data.deadline, formatString, true);
      if (parsedDeadline.isValid() && isPastDate(parsedDeadline.toDate())) {
        setError('deadline', {
          type: 'validate',
          message: 'Deadline cannot be in the past.',
        });
        showErrorToast('Invalid deadline', 'Deadline cannot be in the past.');
        hasErrors = true;
      }

      // Recurring validation (optional, only when enabled)
      if (data.isRecurring) {
        if (!data.recurringEveryValue?.trim() || Number.isNaN(recurringEveryNum)) {
          setError('recurringEveryValue', {
            type: 'required',
            message: 'Repeat interval is required.',
          });
          hasErrors = true;
        } else if (recurringEveryNum <= 0) {
          setError('recurringEveryValue', {
            type: 'validate',
            message: 'Repeat interval must be greater than zero.',
          });
          showErrorToast(
            'Invalid repeat interval',
            'Repeat interval must be greater than zero.',
          );
          hasErrors = true;
        }
        if (!data.recurringEveryUnit) {
          setError('recurringEveryUnit', {
            type: 'required',
            message: 'Repeat unit is required.',
          });
          hasErrors = true;
        }
      }

      if (hasErrors) {
        return;
      }

      // Compute nextDeadline only when recurring is enabled and inputs are valid
      let nextDeadline: string | undefined;
      if (data.isRecurring) {
        const base = moment(data.deadline, formatString, true);
        if (base.isValid() && !Number.isNaN(recurringEveryNum) && recurringEveryNum > 0 && data.recurringEveryUnit) {
          let next = base.clone();
          if (data.recurringEveryUnit === 'D') {
            next = next.add(recurringEveryNum, 'day');
          } else if (data.recurringEveryUnit === 'M') {
            const originalDay = next.date();
            next = next.add(recurringEveryNum, 'month');
            const daysInTargetMonth = next.daysInMonth();
            if (originalDay > daysInTargetMonth) {
              // Clamp to last day of target month when original day doesn't exist
              next = next.date(daysInTargetMonth);
            }
          }
          nextDeadline = formatDate(next.toDate());
        }
      }

      try {
        const payload: any = {
          name: trimmedName,
          amount: numericAmount,
          deadline: data.deadline,
          priority: data.priority,
          description: data.description.trim(),
          status: data.status,
          isRecurring: !!data.isRecurring,
        };

        if (data.isRecurring) {
          payload.recurringEveryValue = recurringEveryNum;
          payload.recurringEveryUnit = data.recurringEveryUnit;
          if (nextDeadline) {
            payload.nextDeadline = nextDeadline;
          }
        }

        const res = await createInvestmentDocument(payload);
        console.log('Investment created:', res);

        emitInvestmentsChanged();
        showSuccessToast(
          'Investment Created',
          'Your investment details have been saved.',
        );
        handleReset();
        onClose();
      } catch (e: any) {
        console.error('Failed to save investment', e);
        showErrorToast(
          'Failed to save',
          e?.message ?? 'Could not save investment.',
        );
      }
    },
    [user, formatString, formatDate, isPastDate, handleReset, setError],
  );

  const onInvalid = useCallback(
    (formErrors: FieldErrors<InvestmentFormState>) => {
      const firstError = Object.values(formErrors)[0] as any;
      const message =
        firstError?.message ??
        firstError?.[0]?.message ??
        'Please check the form and try again.';
      showErrorToast('Invalid input', String(message));
    },
    [],
  );

  const handleDateChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') {
        setOpenDatePicker(false);
        if (event.type === 'set' && date) {
          if (isPastDate(date)) {
            showErrorToast(
              'Invalid deadline',
              'Deadline cannot be in the past.',
            );
            return;
          }
          setDeadlineDate(date);
          setValue('deadline', formatDate(date), { shouldValidate: true });
          clearErrors('deadline');
        }
      } else {
        // iOS: inline/spinner mode – close once date is picked
        if (date) {
          if (isPastDate(date)) {
            showErrorToast(
              'Invalid deadline',
              'Deadline cannot be in the past.',
            );
            setOpenDatePicker(false);
            return;
          }
          setDeadlineDate(date);
          setValue('deadline', formatDate(date), { shouldValidate: true });
          setOpenDatePicker(false);
          clearErrors('deadline');
        }
      }
    },
    [formatDate, isPastDate, setValue, clearErrors],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.colors.background }}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={{ width: 22 }} />
          <Text style={[styles.headerText, { color: theme.colors.foreground }]}>
            Create Investment
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={22} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.screenBody}>
          <View
            style={[
              styles.container,
              {
                backgroundColor: theme.colors.card,
              },
            ]}
          >
            <Text
              style={[
                styles.subheaderText,
                { color: theme.colors.mutedForeground },
              ]}
            >
              Fill in the details below to create a new investment opportunity
            </Text>

            <View
              style={[
                styles.formContainer,
                { backgroundColor: theme.colors.card },
              ]}
            >
              {/* Form Fields (scrollable) */}
              <ScrollView
                style={styles.formFields}
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Investment Name Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text
                      style={[styles.label, { color: theme.colors.foreground }]}
                    >
                      Investment Name
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      errors.investmentName && styles.errorInput,
                      {
                        borderColor: errors.investmentName
                          ? theme.colors.destructive
                          : theme.colors.input,
                        backgroundColor: theme.colors.muted,
                        color: theme.colors.foreground,
                      },
                    ]}
                    value={investmentName}
                    onChangeText={(text) => {
                      setValue('investmentName', text, {
                        shouldValidate: true,
                      });
                      if (errors.investmentName) {
                        clearErrors('investmentName');
                      }
                    }}
                    maxLength={20}
                    placeholder="e.g., Tech Startup Fund"
                    placeholderTextColor={theme.colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.charCounter,
                      { color: theme.colors.mutedForeground },
                    ]}
                  >{`${investmentName.length}/20`}</Text>
                </View>

                {/* Amount Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <DollarSign
                      width={16}
                      height={16}
                      color={theme.colors.mutedForeground}
                    />
                    <Text style={[styles.label, styles.labelWithIconText]}>
                      Investment Amount
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      errors.amount && styles.errorInput,
                      {
                        borderColor: errors.amount
                          ? theme.colors.destructive
                          : theme.colors.input,
                        backgroundColor: theme.colors.muted,
                        color: theme.colors.foreground,
                      },
                    ]}
                    value={amount}
                    onChangeText={(text) => {
                      setValue('amount', formatAmountInput(text), {
                        shouldValidate: true,
                      });
                      if (errors.amount) {
                        clearErrors('amount');
                      }
                    }}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.mutedForeground}
                    keyboardType="numeric"
                  />
                </View>

                {/* Deadline Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Calendar
                      width={16}
                      height={16}
                      color={theme.colors.mutedForeground}
                    />
                    <Text style={[styles.label, styles.labelWithIconText]}>
                      Deadline
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      styles.dateInput,
                      errors.deadline && styles.errorInput,
                      {
                        borderColor: errors.deadline
                          ? theme.colors.destructive
                          : theme.colors.input,
                        backgroundColor: theme.colors.muted,
                      },
                    ]}
                    onPress={() => setOpenDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        !deadline && styles.datePlaceholderText,
                        { color: theme.colors.foreground },
                      ]}
                    >
                      {deadline || formatString}
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.charCounter,
                      { color: theme.colors.mutedForeground },
                    ]}
                  >
                    Deadline cannot be in the past
                  </Text>
                </View>

                {/* Recurring events toggle and fields */}
                <RecurringEventsSection
                  isRecurring={!!isRecurring}
                  recurringEveryValue={recurringEveryValue}
                  recurringEveryUnit={recurringEveryUnit as 'D' | 'M'}
                  errors={errors}
                  setValue={setValue}
                  clearErrors={clearErrors}
                />

                {/* Priority Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <AlertCircle
                      width={16}
                      height={16}
                      color={theme.colors.mutedForeground}
                    />
                    <Text style={[styles.label, styles.labelWithIconText]}>
                      Priority Level
                    </Text>
                  </View>
                  <DropdownSelect
                    value={priorityValue}
                    options={priorityOptions}
                    onChange={(next) => {
                      setValue('priority', next as Priority, {
                        shouldValidate: true,
                      });
                      if (errors.priority) {
                        clearErrors('priority');
                      }
                    }}
                    title="Choose priority"
                    showSearch={false}
                    hasError={!!errors.priority}
                    searchPlaceholder="Search priority"
                    maxListHeight={260}
                  />
                </View>

                {/* Description Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <FileText
                      width={16}
                      height={16}
                      color={theme.colors.mutedForeground}
                    />
                    <Text style={[styles.label, styles.labelWithIconText]}>
                      Description
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textarea,
                      {
                        borderColor: theme.colors.input,
                        backgroundColor: theme.colors.muted,
                        color: theme.colors.foreground,
                      },
                    ]}
                    value={description}
                    onChangeText={(text) => setValue('description', text)}
                    placeholder="Add a description for this investment"
                    placeholderTextColor={theme.colors.mutedForeground}
                    multiline
                    numberOfLines={4}
                    maxLength={100}
                  />
                  <Text
                    style={[
                      styles.charCounter,
                      { color: theme.colors.mutedForeground },
                    ]}
                  >{`${description.length}/100`}</Text>
                </View>
              </ScrollView>

              {/* Form Actions pinned towards bottom */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={rhfHandleSubmit(onSubmit, onInvalid)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: theme.colors.primaryForeground },
                    ]}
                  >
                    Create Investment
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.clearButton,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Clear
                  </Text>
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
  },
  rangeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  rangeModalCard: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  rangeModalClose: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  recurringContainer: {
    marginTop: 8,
  },
  recurringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  recurringDateColumn: {
    flex: 1.4,
  },
  recurringEveryColumn: {
    flex: 1,
  },
  recurringDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recurringDateSeparator: {
    marginHorizontal: 2,
    fontSize: 16,
    fontWeight: '600',
  },
  recurringEveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  recurringEveryInput: {
    width: 56,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  recurringUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recurringUnitChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  recurringUnitText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
