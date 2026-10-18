/** Presentation only. Original names, source text and exports remain unchanged. */
export const displayName = (text: string) => text.replace(/^\s*\[SAMPLE\]\s*/, '').trim();
export const displaySummary = (text: string) => displayName(text).replace(/^Fictional training scenario\. All company facts, interviews, measurements, prices, schedules and funding examples are invented\. No actual application, license, award or customer commitment exists\.\s*/, '');
