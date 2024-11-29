export const hoursOfDay: string[] = Array.from({ length: 24 }, (_, i) => [
  `${i}:00`.padStart(5, "0"),
  `${i}:30`.padStart(5, "0"),
]).flat();
