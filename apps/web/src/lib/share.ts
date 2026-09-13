export function appOrigin() {
  return process.env.AUTH_URL || "http://localhost:3000";
}

export function tryoutShareUrl(token: string) {
  return `${appOrigin()}/t/${token}`;
}

export function whatsappTryoutText(input: {
  title: string;
  itemCount: number;
  minutes: number;
  url: string;
}) {
  return [
    `Tryout: ${input.title}`,
    `${input.itemCount} questions · ${input.minutes} minutes`,
    `Open: ${input.url}`,
    "Enter your full name on the first page.",
  ].join("\n");
}

export function tryoutStatusLabel(isActive: boolean): "Open" | "Closed" {
  return isActive ? "Open" : "Closed";
}
