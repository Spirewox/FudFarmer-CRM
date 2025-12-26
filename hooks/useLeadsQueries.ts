import { ILead } from "@/interface/lead.interface";
import { axiosGet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const fetchLeadsList = async (params : {status ?: string, location ?: string, search : string, agent ?: string}) => {
  const queryParams = new URLSearchParams();

  if(params.search) queryParams.append("search", params.search);

  if(params.status) queryParams.append("status", params.status);

  if(params.location) queryParams.append("location", params.location);

  if(params.agent) queryParams.append("agent", params.agent);

  const response = await axiosGet(`leads?${queryParams.toString()}`, true);
  return response as ILead[];
};

export const useLeadList = (params : {status ?: string, location ?: string, search : string, agent ?: string}) => {
  return useQuery({
    queryKey: ["lead-list", params.status,params.search,params.location, params.agent],
    queryFn: ()=>fetchLeadsList(params),
    retry : false,
  });
};


const fetchLeadsLocations = async () => {
  const response = await axiosGet(`leads/locations`, true);
  return response as string[];
};


export const useLeadsLocations = () => {
  return useQuery({
    queryKey: ["leads-locations"],
    queryFn: ()=>fetchLeadsLocations(),
    retry : false,
  });
};