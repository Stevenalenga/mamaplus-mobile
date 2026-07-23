import { useState } from 'react'
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  DEFAULT_PHONE_COUNTRY,
  getPhoneCountry,
  PHONE_COUNTRIES,
  type PhoneCountry,
} from '../lib/phone-countries'

type PhoneInputProps = {
  countryCode: string
  onCountryChange: (countryCode: string) => void
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function PhoneInput({
  countryCode = DEFAULT_PHONE_COUNTRY,
  onCountryChange,
  value,
  onChange,
  disabled = false,
}: PhoneInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const country = getPhoneCountry(countryCode)

  function selectCountry(option: PhoneCountry) {
    onCountryChange(option.code)
    setPickerOpen(false)
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.countryBtn, disabled && styles.disabled]}
        onPress={() => setPickerOpen(true)}
        disabled={disabled}
        activeOpacity={0.75}
      >
        <Text style={styles.countryCode}>{country.code}</Text>
        <Text style={styles.countryDial}>+{country.dialCode}</Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <View style={[styles.phoneWrap, disabled && styles.disabled]}>
        <Text style={styles.prefix}>+{country.dialCode}</Text>
        <TextInput
          style={styles.phoneInput}
          placeholder={country.placeholder}
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
          value={value}
          onChangeText={onChange}
          editable={!disabled}
        />
      </View>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Select country</Text>
            <FlatList
              data={PHONE_COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const selected = item.code === countryCode
                return (
                  <TouchableOpacity
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => selectCountry(item)}
                    activeOpacity={0.75}
                  >
                    <View>
                      <Text style={styles.optionName}>{item.name}</Text>
                      <Text style={styles.optionMeta}>{item.code} · +{item.dialCode}</Text>
                    </View>
                    {selected ? <Text style={styles.check}>✓</Text> : null}
                  </TouchableOpacity>
                )
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  countryBtn: {
    width: 118,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  countryCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 4,
  },
  countryDial: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
  },
  chevron: {
    fontSize: 12,
    color: '#94a3b8',
  },
  phoneWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingLeft: 12,
  },
  prefix: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 6,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 14,
    color: '#0f172a',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.6,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  optionSelected: {
    backgroundColor: '#eff6ff',
  },
  optionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  optionMeta: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  check: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 16,
  },
})
