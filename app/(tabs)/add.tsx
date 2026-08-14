// Dummy screen — never navigated to. The "+" tab uses a custom tabBarButton
// that triggers the AddHabit modal via AddHabitTrigger context instead of
// performing tab navigation. See app/(tabs)/_layout.tsx.
export default function AddTabPlaceholder() {
  return null;
}
