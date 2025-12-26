export enum ValidLeadStatus{
    new = "new",
    contacted = "contacted",
    negotiation = "negotiation",
    closed_won = "closed won",
    closed_lost = "closed lost"
}


export interface ILead {
    _id ?: string;
  createdAt?: Date;
  updatedAt?: Date;
  business_name ?: string;
  contact_person ?: string;
  contact_person_phone ?: string;
  location ?: string;
  status ?: ValidLeadStatus;
  value ?: number;
  agent ?: string;
  agent_name ?: string;
  notes?: string;
}