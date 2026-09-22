export function formatDuration(seconds: number): string {
  const whole = Math.ceil(Math.max(0, seconds))
  const hours = Math.floor(whole / 3600)
  const minutes = Math.floor((whole % 3600) / 60)
  if (hours === 0) {
    return `${minutes}:${String(whole % 60).padStart(2, '0')}`
  }
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}
