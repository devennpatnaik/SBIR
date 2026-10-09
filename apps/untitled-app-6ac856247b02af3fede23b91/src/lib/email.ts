import type { Contact, Lab, Project, Technology } from './types';

/** A plain, editable first-contact email to a technology-transfer office. Nothing is sent by the app. */
export function draftInquiry(p: Project, t: Technology | undefined, lab: Lab | undefined, contact: Contact | undefined, profile: string) {
  const greeting = contact?.name ? `Dear ${contact.name.split(' ')[0]},` : 'Hello,';
  const ref = [t?.name && `"${t.name}"`, t?.patent_numbers && `(patent no. ${t.patent_numbers})`].filter(Boolean).join(' ');
  const app = p.application_summary.trim() || '[describe the product you want to build]';
  const customer = p.target_customer.trim() || '[target customer]';
  const subject = `Licensing inquiry: ${t?.name ?? p.name}`;
  const body = `${greeting}

${profile.trim() || '[Introduce yourself: your name, background, and your company (or that you are forming one).]'}

I came across ${ref || 'one of your technologies'}${t?.source_url ? ` (${t.source_url})` : ''} and I am interested in commercializing it. My intended application is: ${app}. The initial customers I have in mind are ${customer}.

Could you help me with a few questions?

1. Is this technology currently available to license, and in which fields of use?
2. What is its patent status, and who owns the intellectual property?
3. Which agreements would you suggest for an early-stage company — for example an evaluation license, an option, a non-exclusive or exclusive license, or a CRADA?
4. Is technical assistance or access to the inventors possible?
5. I may apply for SBIR/STTR funding. Would the lab be able to provide a letter of support or discuss collaboration on a proposal?

I would welcome a short call at your convenience. Please let me know the right next step and any forms I should complete.

Thank you for your time,
[Your name]
[Phone] · [Email]`;
  return { subject, body, to: contact?.email || lab?.tto_email || '' };
}

export function draftFollowUp(subject: string, contactName?: string) {
  return {
    subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
    body: `${contactName ? `Dear ${contactName.split(' ')[0]},` : 'Hello,'}

I wanted to follow up on my note below about licensing this technology. I remain very interested and would be grateful for a quick reply on whether it is available and who I should speak with.

Thank you,
[Your name]`,
  };
}
