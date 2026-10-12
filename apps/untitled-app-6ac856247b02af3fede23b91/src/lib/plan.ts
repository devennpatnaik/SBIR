/** Use the complete first paragraph, never truncate away qualifications. Full source remains below. */
export function suggestedNextStep(body:string):string|null{
 const found=body.match(/(?:^|\n)##\s+(?:One(?: useful| small)? next step|Your next step)\s*\n+([^\n]+(?:\n(?!\n|##)[^\n]+)*)/i)?.[1]?.trim();
 return found&&found.length<=900?found:null;
}
