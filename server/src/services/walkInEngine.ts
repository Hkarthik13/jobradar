import { WalkIn, JobCategory, ExperienceLevel } from 'jobradar-shared';

export interface RawJobPayload {
  title: string;
  companyName: string;
  companyId?: string;
  companyLogo?: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  sourceName: string;
  sourceUrl: string;
  salaryText?: string;
  publishedDate?: string;
}

export class WalkInEngine {
  private static WALK_IN_KEYWORDS = [
    /walk[\s-]?in/i,
    /direct\s+interview/i,
    /recruitment\s+drive/i,
    /hiring\s+drive/i,
    /spot\s+offer/i,
    /mega\s+job\s+fair/i
  ];

  /**
   * Check if a raw job text or title matches walk-in criteria
   */
  public static isWalkInOpportunity(text: string): boolean {
    return this.WALK_IN_KEYWORDS.some((regex) => regex.test(text));
  }

  /**
   * Parse and extract structured WalkIn data from raw job feed/announcement
   */
  public static extractWalkIn(payload: RawJobPayload): WalkIn | null {
    const combinedText = `${payload.title}\n${payload.description}`;
    if (!this.isWalkInOpportunity(combinedText)) {
      return null;
    }

    // Extract Date
    const extractedDate = this.extractDate(combinedText) || new Date().toISOString().split('T')[0];

    // Extract Time Slot
    const extractedTime = this.extractTimeSlot(combinedText) || '10:00 AM - 03:00 PM';

    // Extract Venue / Address
    const extractedVenue = this.extractVenue(combinedText, payload.location);

    // Extract Category & Experience
    const category = this.detectCategory(combinedText);
    const experience = this.detectExperience(combinedText);
    const eligibility = this.extractEligibility(combinedText);

    const walkInId = `walkin-ext-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const companyId = payload.companyId || `comp-ext-${payload.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    return {
      id: walkInId,
      companyId,
      companyName: payload.companyName,
      companyLogo: payload.companyLogo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop',
      positionTitle: payload.title.replace(/walk[\s-]?in\s*(interview|drive)?:?/gi, '').trim() || payload.title,
      jobCategory: category,
      eligibility,
      experience,
      salaryText: payload.salaryText || 'Competitive / As per industry standards',
      date: extractedDate,
      timeSlot: extractedTime,
      venueAddress: extractedVenue,
      venueCoordinates: {
        latitude: payload.latitude,
        longitude: payload.longitude,
      },
      registrationRequired: /registration\s+required|register\s+online/i.test(combinedText),
      registrationLink: this.extractLink(combinedText) || payload.sourceUrl,
      sourceName: payload.sourceName,
      sourceUrl: payload.sourceUrl,
      discoveredAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      status: this.determineStatus(extractedDate),
      notes: 'Extracted automatically from verified recruitment source.'
    };
  }

  private static extractDate(text: string): string | null {
    // Matches YYYY-MM-DD, DD/MM/YYYY, or "30 September 2026", "Tomorrow", "Today"
    if (/\btoday\b/i.test(text)) {
      return new Date().toISOString().split('T')[0];
    }
    if (/\btomorrow\b/i.test(text)) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }

    const isoMatch = text.match(/\b(202[4-9]-\d{2}-\d{2})\b/);
    if (isoMatch) return isoMatch[1];

    const monthMatch = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i);
    if (monthMatch) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthIdx = monthNames.findIndex((m) => monthMatch[2].toLowerCase().startsWith(m));
      if (monthIdx !== -1) {
        const day = monthMatch[1].padStart(2, '0');
        const month = String(monthIdx + 1).padStart(2, '0');
        const year = monthMatch[3];
        return `${year}-${month}-${day}`;
      }
    }

    return null;
  }

  private static extractTimeSlot(text: string): string | null {
    const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/i);
    if (timeMatch) {
      return `${timeMatch[1]} - ${timeMatch[2]}`;
    }
    return null;
  }

  private static extractVenue(text: string, defaultLocation: string): string {
    const venueMatch = text.match(/venue\s*:\s*([^\n\r]+)/i);
    if (venueMatch && venueMatch[1].trim().length > 5) {
      return venueMatch[1].trim();
    }
    return defaultLocation || 'Company Campus / Registered Office';
  }

  private static extractEligibility(text: string): string {
    const eligMatch = text.match(/(?:eligibility|qualification|criteria)\s*:\s*([^\n\r]+)/i);
    if (eligMatch && eligMatch[1].trim().length > 5) {
      return eligMatch[1].trim();
    }
    return 'Graduates / Diploma / B.E / B.Tech / BCA / Any degree with relevant skills';
  }

  private static extractLink(text: string): string | null {
    const linkMatch = text.match(/https?:\/\/[^\s$.?#].[^\s]*/i);
    return linkMatch ? linkMatch[0] : null;
  }

  public static detectCategory(text: string): JobCategory {
    const t = text.toLowerCase();
    if (t.includes('react') || t.includes('frontend') || t.includes('angular') || t.includes('web dev')) return 'Web Development';
    if (t.includes('ai') || t.includes('ml') || t.includes('machine learning') || t.includes('deep learning')) return 'AI/ML';
    if (t.includes('data') || t.includes('analyst') || t.includes('sql') || t.includes('power bi')) return 'Data';
    if (t.includes('devops') || t.includes('cloud') || t.includes('aws') || t.includes('kubernetes')) return 'DevOps';
    if (t.includes('cyber') || t.includes('security') || t.includes('soc')) return 'Cybersecurity';
    if (t.includes('bpo') || t.includes('voice') || t.includes('customer support') || t.includes('non-voice')) return 'BPO';
    if (t.includes('finance') || t.includes('accountant') || t.includes('audit')) return 'Finance';
    if (t.includes('hr') || t.includes('recruiter') || t.includes('talent')) return 'HR';
    if (t.includes('sales') || t.includes('business development') || t.includes('marketing')) return 'Sales';
    if (t.includes('testing') || t.includes('qa') || t.includes('automation')) return 'Testing';
    if (t.includes('mechanical') || t.includes('embedded') || t.includes('electrical') || t.includes('cad')) return 'Core Engineering';
    return 'Software';
  }

  public static detectExperience(text: string): ExperienceLevel {
    const t = text.toLowerCase();
    if (t.includes('fresher') || t.includes('freshers') || t.includes('entry level') || t.includes('trainee') || t.includes('2024') || t.includes('2025') || t.includes('2026 batch')) {
      return 'Fresher';
    }
    if (t.includes('0-1') || t.includes('0 to 1') || t.includes('1 year')) {
      return '0–1 years';
    }
    if (t.includes('1-3') || t.includes('1 to 3') || t.includes('2 year')) {
      return '1–3 years';
    }
    return '3+ years';
  }

  private static determineStatus(dateStr: string): 'ACTIVE_TODAY' | 'UPCOMING' | 'COMPLETED' {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'ACTIVE_TODAY';
    if (dateStr > today) return 'UPCOMING';
    return 'COMPLETED';
  }
}
