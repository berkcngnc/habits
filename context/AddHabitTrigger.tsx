import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { HabitFrequency, HabitType } from './HabitsContext';

interface AddHabitFlowContextValue {
  // modal visibility
  isOpen: boolean;
  open: () => void;
  close: () => void;

  // form state
  newHabitText: string;
  setNewHabitText: (v: string) => void;
  habitSelectionType: HabitType;
  setHabitSelectionType: (v: HabitType) => void;
  selectedIcon: string;
  setSelectedIcon: (v: string) => void;
  selectedColor: string;
  setSelectedColor: (v: string) => void;
  selectedFrequency: HabitFrequency;
  setSelectedFrequency: (v: HabitFrequency) => void;
  selectedCustomDays: number[];
  setSelectedCustomDays: (v: number[]) => void;
  selectedReminder: string;
  setSelectedReminder: (v: string) => void;

  // sub-pickers
  showTimePicker: boolean;
  setShowTimePicker: (v: boolean) => void;
  showCustomDaysPicker: boolean;
  setShowCustomDaysPicker: (v: boolean) => void;

  // negative habit fields
  costPerDay: string;
  setCostPerDay: (v: string) => void;
  timePerDay: string;
  setTimePerDay: (v: string) => void;

  // success toast
  showSuccess: boolean;
  setShowSuccess: (v: boolean) => void;

  // helpers
  resetForm: () => void;
}

const noop = () => {};

const AddHabitFlowContext = createContext<AddHabitFlowContextValue>({
  isOpen: false,
  open: noop,
  close: noop,
  newHabitText: '',
  setNewHabitText: noop,
  habitSelectionType: 'positive',
  setHabitSelectionType: noop,
  selectedIcon: 'star',
  setSelectedIcon: noop,
  selectedColor: '#3b82f6',
  setSelectedColor: noop,
  selectedFrequency: 'daily',
  setSelectedFrequency: noop,
  selectedCustomDays: [],
  setSelectedCustomDays: noop,
  selectedReminder: '',
  setSelectedReminder: noop,
  showTimePicker: false,
  setShowTimePicker: noop,
  showCustomDaysPicker: false,
  setShowCustomDaysPicker: noop,
  costPerDay: '',
  setCostPerDay: noop,
  timePerDay: '',
  setTimePerDay: noop,
  showSuccess: false,
  setShowSuccess: noop,
  resetForm: noop,
});

export function AddHabitTriggerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const [newHabitText, setNewHabitText] = useState('');
  const [habitSelectionType, setHabitSelectionType] = useState<HabitType>('positive');
  const [selectedIcon, setSelectedIcon] = useState('star');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [selectedFrequency, setSelectedFrequency] = useState<HabitFrequency>('daily');
  const [selectedCustomDays, setSelectedCustomDays] = useState<number[]>([]);
  const [selectedReminder, setSelectedReminder] = useState('');

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCustomDaysPicker, setShowCustomDaysPicker] = useState(false);

  const [costPerDay, setCostPerDay] = useState('');
  const [timePerDay, setTimePerDay] = useState('');

  const [showSuccess, setShowSuccess] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setShowTimePicker(false);
    setShowCustomDaysPicker(false);
  }, []);

  const resetForm = useCallback(() => {
    setNewHabitText('');
    setSelectedIcon('star');
    setSelectedColor('#3b82f6');
    setSelectedFrequency('daily');
    setSelectedCustomDays([]);
    setSelectedReminder('');
    setCostPerDay('');
    setTimePerDay('');
    setShowTimePicker(false);
    setShowCustomDaysPicker(false);
  }, []);

  return (
    <AddHabitFlowContext.Provider
      value={{
        isOpen, open, close,
        newHabitText, setNewHabitText,
        habitSelectionType, setHabitSelectionType,
        selectedIcon, setSelectedIcon,
        selectedColor, setSelectedColor,
        selectedFrequency, setSelectedFrequency,
        selectedCustomDays, setSelectedCustomDays,
        selectedReminder, setSelectedReminder,
        showTimePicker, setShowTimePicker,
        showCustomDaysPicker, setShowCustomDaysPicker,
        costPerDay, setCostPerDay,
        timePerDay, setTimePerDay,
        showSuccess, setShowSuccess,
        resetForm,
      }}
    >
      {children}
    </AddHabitFlowContext.Provider>
  );
}

export const useAddHabitFlow = () => useContext(AddHabitFlowContext);

// Backwards-compat alias used by the navbar "+" button.
export const useAddHabitTrigger = () => {
  const { open } = useAddHabitFlow();
  return { trigger: open, signal: 0 };
};
