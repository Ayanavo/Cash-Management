import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { RefreshCw } from 'lucide-react-native';
import type { Theme } from '../theme/restyleTheme';
import type {
  InvestmentFormState,
} from '../interfaces/components.types';
import type {
  FieldErrors,
  UseFormClearErrors,
  UseFormSetValue,
} from 'react-hook-form';
import Toggle from './Toggle';

type RecurringEventsSectionProps = {
  isRecurring: boolean;
  recurringEveryValue: string;
  recurringEveryUnit: 'D' | 'M';
  errors: FieldErrors<InvestmentFormState>;
  setValue: UseFormSetValue<InvestmentFormState>;
  clearErrors: UseFormClearErrors<InvestmentFormState>;
};

const RecurringEventsSection: React.FC<RecurringEventsSectionProps> = ({
  isRecurring,
  recurringEveryValue,
  recurringEveryUnit,
  errors,
  setValue,
  clearErrors,
}) => {
  const theme = useTheme<Theme>();

  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <RefreshCw
          width={16}
          height={16}
          color={theme.colors.mutedForeground}
        />
        <Text
          style={[
            styles.label,
            styles.labelWithIconText,
            { color: theme.colors.foreground },
          ]}
        >
          Recurring events
        </Text>
        <View style={{ marginLeft: 'auto' }}>
          <Toggle
            value={!!isRecurring}
            onValueChange={(val) => {
              setValue('isRecurring', val);
              if (!val) {
                // Reset recurring fields when turning off
                setValue('recurringEveryValue', '');
                setValue('recurringEveryUnit', 'M');
                clearErrors([
                  'recurringEveryValue',
                  'recurringEveryUnit',
                ]);
              } else {
                // Ensure a default of "1" when turning on and no value present
                if (!recurringEveryValue?.trim()) {
                  setValue('recurringEveryValue', '1', {
                    shouldValidate: true,
                  });
                }
                if (!recurringEveryUnit) {
                  setValue('recurringEveryUnit', 'M', {
                    shouldValidate: true,
                  });
                }
              }
            }}
          />
        </View>
      </View>

      {isRecurring && (
        <View style={styles.recurringContainer}>
          <View style={styles.recurringRow}>
            <View style={styles.recurringEveryColumn}>
              <Text
                style={[
                  styles.label,
                  { color: theme.colors.mutedForeground },
                ]}
              >
                Repeat every
              </Text>
              <View style={styles.recurringEveryRow}>
                <TextInput
                  style={[
                    styles.recurringEveryInput,
                    errors.recurringEveryValue && styles.errorInput,
                    {
                      borderColor: errors.recurringEveryValue
                        ? theme.colors.destructive
                        : theme.colors.input,
                      backgroundColor: theme.colors.muted,
                      color: theme.colors.foreground,
                    },
                  ]}
                  keyboardType="numeric"
                  value={recurringEveryValue}
                  onChangeText={(text) => {
                    setValue('recurringEveryValue', text, {
                      shouldValidate: true,
                    });
                    if (errors.recurringEveryValue) {
                      clearErrors('recurringEveryValue');
                    }
                  }}
                  placeholder="1"
                  placeholderTextColor={theme.colors.mutedForeground}
                />
                <View style={styles.recurringUnitRow}>
                  {(['D', 'M'] as const).map((unit) => {
                    const active = recurringEveryUnit === unit;
                    const label = unit === 'D' ? 'Day' : 'Month';
                    return (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.recurringUnitChip,
                          {
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.card,
                          },
                          active && {
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.primary,
                          },
                        ]}
                        onPress={() =>
                          setValue('recurringEveryUnit', unit, {
                            shouldValidate: true,
                          })
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.recurringUnitText,
                            {
                              color: active
                                ? theme.colors.primaryForeground
                                : theme.colors.foreground,
                            },
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 16,
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
  errorInput: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  recurringContainer: {
    marginTop: 8,
  },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  recurringEveryColumn: {
    flex: 1,
  },
  recurringEveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  recurringEveryInput: {
    width: 120,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    fontSize: 14,
    marginRight: 4,
  },
  recurringUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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

export default RecurringEventsSection;


