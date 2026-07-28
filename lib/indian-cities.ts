export interface IndianCity {
  name: string
  state: string
  type: 'Metropolitan' | 'Capital' | 'Major' | 'Regional'
  population?: string
}
 
export const INDIAN_CITIES: IndianCity[] = [
  // Metropolitan Cities
  { name: 'Mumbai', state: 'Maharashtra', type: 'Metropolitan', population: '20.4M' },
  { name: 'Delhi', state: 'Delhi', type: 'Metropolitan', population: '20.9M' },
  { name: 'Bangalore', state: 'Karnataka', type: 'Metropolitan', population: '12.3M' },
  { name: 'Hyderabad', state: 'Telangana', type: 'Metropolitan', population: '10.1M' },
  { name: 'Chennai', state: 'Tamil Nadu', type: 'Metropolitan', population: '11.2M' },
  { name: 'Kolkata', state: 'West Bengal', type: 'Metropolitan', population: '14.8M' },
  { name: 'Pune', state: 'Maharashtra', type: 'Metropolitan', population: '7.2M' },
  { name: 'Ahmedabad', state: 'Gujarat', type: 'Metropolitan', population: '7.2M' },
  { name: 'Surat', state: 'Gujarat', type: 'Metropolitan', population: '6.8M' },
  { name: 'Jaipur', state: 'Rajasthan', type: 'Metropolitan', population: '3.1M' },
 
  // State Capitals
  { name: 'Bhopal', state: 'Madhya Pradesh', type: 'Capital' },
  { name: 'Patna', state: 'Bihar', type: 'Capital' },
  { name: 'Lucknow', state: 'Uttar Pradesh', type: 'Capital' },
  { name: 'Chandigarh', state: 'Chandigarh', type: 'Capital' },
  { name: 'Dehradun', state: 'Uttarakhand', type: 'Capital' },
  { name: 'Shimla', state: 'Himachal Pradesh', type: 'Capital' },
  { name: 'Srinagar', state: 'Jammu & Kashmir', type: 'Capital' },
  { name: 'Ranchi', state: 'Jharkhand', type: 'Capital' },
  { name: 'Raipur', state: 'Chhattisgarh', type: 'Capital' },
  { name: 'Bhubaneswar', state: 'Odisha', type: 'Capital' },
  { name: 'Thiruvananthapuram', state: 'Kerala', type: 'Capital' },
  { name: 'Panaji', state: 'Goa', type: 'Capital' },
  { name: 'Gangtok', state: 'Sikkim', type: 'Capital' },
  { name: 'Agartala', state: 'Tripura', type: 'Capital' },
  { name: 'Shillong', state: 'Meghalaya', type: 'Capital' },
  { name: 'Kohima', state: 'Nagaland', type: 'Capital' },
  { name: 'Imphal', state: 'Manipur', type: 'Capital' },
  { name: 'Aizawl', state: 'Mizoram', type: 'Capital' },
  { name: 'Itanagar', state: 'Arunachal Pradesh', type: 'Capital' },
  { name: 'Dispur', state: 'Assam', type: 'Capital' },
 
  // Major Cities - Maharashtra
  { name: 'Nagpur', state: 'Maharashtra', type: 'Major' },
  { name: 'Thane', state: 'Maharashtra', type: 'Major' },
  { name: 'Nashik', state: 'Maharashtra', type: 'Major' },
  { name: 'Aurangabad', state: 'Maharashtra', type: 'Major' },
  { name: 'Solapur', state: 'Maharashtra', type: 'Major' },
  { name: 'Kolhapur', state: 'Maharashtra', type: 'Major' },
  { name: 'Amravati', state: 'Maharashtra', type: 'Major' },
  { name: 'Nanded', state: 'Maharashtra', type: 'Major' },
  { name: 'Sangli', state: 'Maharashtra', type: 'Major' },
  { name: 'Jalgaon', state: 'Maharashtra', type: 'Major' },
 
  // Major Cities - Karnataka
  { name: 'Mysore', state: 'Karnataka', type: 'Major' },
  { name: 'Hubli', state: 'Karnataka', type: 'Major' },
  { name: 'Mangalore', state: 'Karnataka', type: 'Major' },
  { name: 'Belgaum', state: 'Karnataka', type: 'Major' },
  { name: 'Gulbarga', state: 'Karnataka', type: 'Major' },
  { name: 'Davangere', state: 'Karnataka', type: 'Major' },
  { name: 'Bellary', state: 'Karnataka', type: 'Major' },
  { name: 'Bijapur', state: 'Karnataka', type: 'Major' },
  { name: 'Shimoga', state: 'Karnataka', type: 'Major' },
  { name: 'Tumkur', state: 'Karnataka', type: 'Major' },
 
  // Major Cities - Tamil Nadu
  { name: 'Coimbatore', state: 'Tamil Nadu', type: 'Major' },
  { name: 'Madurai', state: 'Tamil Nadu', type: 'Major' },
  { name: 'Salem', state: 'Tamil Nadu', type: 'Major' },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', type: 'Major' },
  { name: 'Vellore', state: 'Tamil Nadu', type: 'Major' },
  { name: 'Erode', state: 'Tamil Nadu', type: 'Major' },
  { name: 'Tiruppur', state: 'Tamil Nadu', type: 'Major' },
  { name: 'Thoothukkudi', state: 'Tamil Nadu', type: 'Major' },
  { name: 'Dindigul', state: 'Tamil Nadu', type: 'Major' },
  { name: 'Thanjavur', state: 'Tamil Nadu', type: 'Major' },
 
  // Major Cities - Gujarat
  { name: 'Vadodara', state: 'Gujarat', type: 'Major' },
  { name: 'Rajkot', state: 'Gujarat', type: 'Major' },
  { name: 'Bhavnagar', state: 'Gujarat', type: 'Major' },
  { name: 'Jamnagar', state: 'Gujarat', type: 'Major' },
  { name: 'Gandhinagar', state: 'Gujarat', type: 'Major' },
  { name: 'Anand', state: 'Gujarat', type: 'Major' },
  { name: 'Bharuch', state: 'Gujarat', type: 'Major' },
  { name: 'Valsad', state: 'Gujarat', type: 'Major' },
  { name: 'Junagadh', state: 'Gujarat', type: 'Major' },
  { name: 'Porbandar', state: 'Gujarat', type: 'Major' },
 
  // Major Cities - Uttar Pradesh
  { name: 'Kanpur', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Varanasi', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Agra', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Prayagraj', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Bareilly', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Gorakhpur', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Aligarh', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Moradabad', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Saharanpur', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Jhansi', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Allahabad', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Lucknow', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Meerut', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Saharanpur', state: 'Uttar Pradesh', type: 'Major' },
  { name: 'Bindki', state: 'Uttar Pradesh', type: 'Major' },
 
  // Major Cities - West Bengal
  { name: 'Howrah', state: 'West Bengal', type: 'Major' },
  { name: 'Durgapur', state: 'West Bengal', type: 'Major' },
  { name: 'Asansol', state: 'West Bengal', type: 'Major' },
  { name: 'Siliguri', state: 'West Bengal', type: 'Major' },
  { name: 'Bardhaman', state: 'West Bengal', type: 'Major' },
  { name: 'Malda', state: 'West Bengal', type: 'Major' },
  { name: 'Bishnupur', state: 'West Bengal', type: 'Major' },
  { name: 'Bankura', state: 'West Bengal', type: 'Major' },
  { name: 'Purulia', state: 'West Bengal', type: 'Major' },
  { name: 'Cooch Behar', state: 'West Bengal', type: 'Major' },
 
  // Major Cities - Telangana
  { name: 'Warangal', state: 'Telangana', type: 'Major' },
  { name: 'Karimnagar', state: 'Telangana', type: 'Major' },
  { name: 'Nizamabad', state: 'Telangana', type: 'Major' },
  { name: 'Adilabad', state: 'Telangana', type: 'Major' },
  { name: 'Khammam', state: 'Telangana', type: 'Major' },
  { name: 'Nalgonda', state: 'Telangana', type: 'Major' },
  { name: 'Mahbubnagar', state: 'Telangana', type: 'Major' },
  { name: 'Medak', state: 'Telangana', type: 'Major' },
  { name: 'Rangareddy', state: 'Telangana', type: 'Major' },
  { name: 'Siddipet', state: 'Telangana', type: 'Major' },
 
  // Major Cities - Madhya Pradesh
  { name: 'Indore', state: 'Madhya Pradesh', type: 'Major' },
  { name: 'Gwalior', state: 'Madhya Pradesh', type: 'Major' },
  { name: 'Jabalpur', state: 'Madhya Pradesh', type: 'Major' },
  { name: 'Ujjain', state: 'Madhya Pradesh', type: 'Major' },
  { name: 'Sagar', state: 'Madhya Pradesh', type: 'Major' },
  { name: 'Dewas', state: 'Madhya Pradesh', type: 'Major' },
  { name: 'Satna', state: 'Madhya Pradesh', type: 'Major' },
  { name: 'Ratlam', state: 'Madhya Pradesh', type: 'Major' },
  { name: 'Rewa', state: 'Madhya Pradesh', type: 'Major' },
  { name: 'Murwara', state: 'Madhya Pradesh', type: 'Major' },
 
  // Major Cities - Rajasthan
  { name: 'Jodhpur', state: 'Rajasthan', type: 'Major' },
  { name: 'Kota', state: 'Rajasthan', type: 'Major' },
  { name: 'Bikaner', state: 'Rajasthan', type: 'Major' },
  { name: 'Ajmer', state: 'Rajasthan', type: 'Major' },
  { name: 'Udaipur', state: 'Rajasthan', type: 'Major' },
  { name: 'Sikar', state: 'Rajasthan', type: 'Major' },
  { name: 'Sri Ganganagar', state: 'Rajasthan', type: 'Major' },
  { name: 'Alwar', state: 'Rajasthan', type: 'Major' },
  { name: 'Bhilwara', state: 'Rajasthan', type: 'Major' },
  { name: 'Pali', state: 'Rajasthan', type: 'Major' },
 
  // Major Cities - Andhra Pradesh
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', type: 'Major' },
  { name: 'Vijayawada', state: 'Andhra Pradesh', type: 'Major' },
  { name: 'Guntur', state: 'Andhra Pradesh', type: 'Major' },
  { name: 'Nellore', state: 'Andhra Pradesh', type: 'Major' },
  { name: 'Kurnool', state: 'Andhra Pradesh', type: 'Major' },
  { name: 'Rajahmundry', state: 'Andhra Pradesh', type: 'Major' },
  { name: 'Kakinada', state: 'Andhra Pradesh', type: 'Major' },
  { name: 'Tirupati', state: 'Andhra Pradesh', type: 'Major' },
  { name: 'Anantapur', state: 'Andhra Pradesh', type: 'Major' },
  { name: 'Kadapa', state: 'Andhra Pradesh', type: 'Major' },
 
  // Major Cities - Kerala
  { name: 'Kochi', state: 'Kerala', type: 'Major' },
  { name: 'Kozhikode', state: 'Kerala', type: 'Major' },
  { name: 'Thrissur', state: 'Kerala', type: 'Major' },
  { name: 'Kollam', state: 'Kerala', type: 'Major' },
  { name: 'Alappuzha', state: 'Kerala', type: 'Major' },
  { name: 'Palakkad', state: 'Kerala', type: 'Major' },
  { name: 'Kottayam', state: 'Kerala', type: 'Major' },
  { name: 'Kannur', state: 'Kerala', type: 'Major' },
  { name: 'Pathanamthitta', state: 'Kerala', type: 'Major' },
  { name: 'Idukki', state: 'Kerala', type: 'Major' },
 
  // Major Cities - Punjab
  { name: 'Ludhiana', state: 'Punjab', type: 'Major' },
  { name: 'Amritsar', state: 'Punjab', type: 'Major' },
  { name: 'Jalandhar', state: 'Punjab', type: 'Major' },
  { name: 'Patiala', state: 'Punjab', type: 'Major' },
  { name: 'Bathinda', state: 'Punjab', type: 'Major' },
  { name: 'Pathankot', state: 'Punjab', type: 'Major' },
  { name: 'Hoshiarpur', state: 'Punjab', type: 'Major' },
  { name: 'Moga', state: 'Punjab', type: 'Major' },
  { name: 'Firozpur', state: 'Punjab', type: 'Major' },
  { name: 'Sangrur', state: 'Punjab', type: 'Major' },
 
  // Major Cities - Haryana
  { name: 'Gurgaon', state: 'Haryana', type: 'Major' },
  { name: 'Faridabad', state: 'Haryana', type: 'Major' },
  { name: 'Panipat', state: 'Haryana', type: 'Major' },
  { name: 'Yamunanagar', state: 'Haryana', type: 'Major' },
  { name: 'Rohtak', state: 'Haryana', type: 'Major' },
  { name: 'Hisar', state: 'Haryana', type: 'Major' },
  { name: 'Karnal', state: 'Haryana', type: 'Major' },
  { name: 'Sonipat', state: 'Haryana', type: 'Major' },
  { name: 'Ambala', state: 'Haryana', type: 'Major' },
  { name: 'Bhiwani', state: 'Haryana', type: 'Major' },
 
  // Union Territories
  { name: 'Puducherry', state: 'Puducherry', type: 'Capital' },
  { name: 'Port Blair', state: 'Andaman & Nicobar', type: 'Capital' },
  { name: 'Kavaratti', state: 'Lakshadweep', type: 'Capital' },
  { name: 'Silvassa', state: 'Dadra & Nagar Haveli', type: 'Capital' },
  { name: 'Daman', state: 'Daman & Diu', type: 'Capital' },
  { name: 'Diu', state: 'Daman & Diu', type: 'Capital' },
 
  // Regional Cities - North East
  { name: 'Guwahati', state: 'Assam', type: 'Regional' },
  { name: 'Dibrugarh', state: 'Assam', type: 'Regional' },
  { name: 'Jorhat', state: 'Assam', type: 'Regional' },
  { name: 'Silchar', state: 'Assam', type: 'Regional' },
  { name: 'Tinsukia', state: 'Assam', type: 'Regional' },
  { name: 'Tezpur', state: 'Assam', type: 'Regional' },
  { name: 'Nagaon', state: 'Assam', type: 'Regional' },
  { name: 'Sivasagar', state: 'Assam', type: 'Regional' },
  { name: 'Dhubri', state: 'Assam', type: 'Regional' },
  { name: 'Goalpara', state: 'Assam', type: 'Regional' },
 
  // Regional Cities - Odisha
  { name: 'Cuttack', state: 'Odisha', type: 'Regional' },
  { name: 'Rourkela', state: 'Odisha', type: 'Regional' },
  { name: 'Brahmapur', state: 'Odisha', type: 'Regional' },
  { name: 'Sambalpur', state: 'Odisha', type: 'Regional' },
  { name: 'Puri', state: 'Odisha', type: 'Regional' },
  { name: 'Balasore', state: 'Odisha', type: 'Regional' },
  { name: 'Bhadrak', state: 'Odisha', type: 'Regional' },
  { name: 'Baripada', state: 'Odisha', type: 'Regional' },
  { name: 'Jharsuguda', state: 'Odisha', type: 'Regional' },
  { name: 'Angul', state: 'Odisha', type: 'Regional' },
 
  // Regional Cities - Jharkhand
  { name: 'Jamshedpur', state: 'Jharkhand', type: 'Regional' },
  { name: 'Dhanbad', state: 'Jharkhand', type: 'Regional' },
  { name: 'Bokaro', state: 'Jharkhand', type: 'Regional' },
  { name: 'Hazaribagh', state: 'Jharkhand', type: 'Regional' },
  { name: 'Giridih', state: 'Jharkhand', type: 'Regional' },
  { name: 'Deoghar', state: 'Jharkhand', type: 'Regional' },
  { name: 'Ramgarh', state: 'Jharkhand', type: 'Regional' },
  { name: 'Chatra', state: 'Jharkhand', type: 'Regional' },
  { name: 'Koderma', state: 'Jharkhand', type: 'Regional' },
  { name: 'Godda', state: 'Jharkhand', type: 'Regional' },
 
  // Regional Cities - Chhattisgarh
  { name: 'Bilaspur', state: 'Chhattisgarh', type: 'Regional' },
  { name: 'Korba', state: 'Chhattisgarh', type: 'Regional' },
  { name: 'Durg', state: 'Chhattisgarh', type: 'Regional' },
  { name: 'Bhilai', state: 'Chhattisgarh', type: 'Regional' },
  { name: 'Jagdalpur', state: 'Chhattisgarh', type: 'Regional' },
  { name: 'Ambikapur', state: 'Chhattisgarh', type: 'Regional' },
  { name: 'Rajnandgaon', state: 'Chhattisgarh', type: 'Regional' },
  { name: 'Dhamtari', state: 'Chhattisgarh', type: 'Regional' },
  { name: 'Mahasamund', state: 'Chhattisgarh', type: 'Regional' },
  { name: 'Kanker', state: 'Chhattisgarh', type: 'Regional' },
 
  // Regional Cities - Uttarakhand
  { name: 'Haridwar', state: 'Uttarakhand', type: 'Regional' },
  { name: 'Rishikesh', state: 'Uttarakhand', type: 'Regional' },
  { name: 'Haldwani', state: 'Uttarakhand', type: 'Regional' },
  { name: 'Roorkee', state: 'Uttarakhand', type: 'Regional' },
  { name: 'Kashipur', state: 'Uttarakhand', type: 'Regional' },
  { name: 'Rudrapur', state: 'Uttarakhand', type: 'Regional' },
  { name: 'Kotdwara', state: 'Uttarakhand', type: 'Regional' },
  { name: 'Mussoorie', state: 'Uttarakhand', type: 'Regional' },
  { name: 'Nainital', state: 'Uttarakhand', type: 'Regional' },
  { name: 'Almora', state: 'Uttarakhand', type: 'Regional' },
 
  // Regional Cities - Himachal Pradesh
  { name: 'Solan', state: 'Himachal Pradesh', type: 'Regional' },
  { name: 'Mandi', state: 'Himachal Pradesh', type: 'Regional' },
  { name: 'Kullu', state: 'Himachal Pradesh', type: 'Regional' },
  { name: 'Dharamshala', state: 'Himachal Pradesh', type: 'Regional' },
  { name: 'Palampur', state: 'Himachal Pradesh', type: 'Regional' },
  { name: 'Manali', state: 'Himachal Pradesh', type: 'Regional' },
  { name: 'Chamba', state: 'Himachal Pradesh', type: 'Regional' },
  { name: 'Kangra', state: 'Himachal Pradesh', type: 'Regional' },
  { name: 'Una', state: 'Himachal Pradesh', type: 'Regional' },
  { name: 'Hamirpur', state: 'Himachal Pradesh', type: 'Regional' },
 
  // Regional Cities - Jammu & Kashmir
  { name: 'Jammu', state: 'Jammu & Kashmir', type: 'Regional' },
  { name: 'Udhampur', state: 'Jammu & Kashmir', type: 'Regional' },
  { name: 'Kathua', state: 'Jammu & Kashmir', type: 'Regional' },
  { name: 'Samba', state: 'Jammu & Kashmir', type: 'Regional' },
  { name: 'Rajouri', state: 'Jammu & Kashmir', type: 'Regional' },
  { name: 'Poonch', state: 'Jammu & Kashmir', type: 'Regional' },
  { name: 'Doda', state: 'Jammu & Kashmir', type: 'Regional' },
  { name: 'Kishtwar', state: 'Jammu & Kashmir', type: 'Regional' },
  { name: 'Ramban', state: 'Jammu & Kashmir', type: 'Regional' },
  { name: 'Reasi', state: 'Jammu & Kashmir', type: 'Regional' },
 
  // Regional Cities - Goa
  { name: 'Margao', state: 'Goa', type: 'Regional' },
  { name: 'Vasco da Gama', state: 'Goa', type: 'Regional' },
  { name: 'Mapusa', state: 'Goa', type: 'Regional' },
  { name: 'Ponda', state: 'Goa', type: 'Regional' },
  { name: 'Mormugao', state: 'Goa', type: 'Regional' },
  { name: 'Sanquelim', state: 'Goa', type: 'Regional' },
  { name: 'Bicholim', state: 'Goa', type: 'Regional' },
  { name: 'Valpoi', state: 'Goa', type: 'Regional' },
  { name: 'Sanguem', state: 'Goa', type: 'Regional' },
  { name: 'Canacona', state: 'Goa', type: 'Regional' },
 
  // Regional Cities - Sikkim
  { name: 'Gangtok', state: 'Sikkim', type: 'Capital' },
  { name: 'Namchi', state: 'Sikkim', type: 'Regional' },
  { name: 'Mangan', state: 'Sikkim', type: 'Regional' },
  { name: 'Gyalshing', state: 'Sikkim', type: 'Regional' },
  { name: 'Ravongla', state: 'Sikkim', type: 'Regional' },
  { name: 'Jorethang', state: 'Sikkim', type: 'Regional' },
  { name: 'Singtam', state: 'Sikkim', type: 'Regional' },
  { name: 'Rangpo', state: 'Sikkim', type: 'Regional' },
  { name: 'Lachung', state: 'Sikkim', type: 'Regional' },
  { name: 'Lachen', state: 'Sikkim', type: 'Regional' },
 
  // Regional Cities - Tripura
  { name: 'Agartala', state: 'Tripura', type: 'Capital' },
  { name: 'Udaipur', state: 'Tripura', type: 'Regional' },
  { name: 'Dharmanagar', state: 'Tripura', type: 'Regional' },
  { name: 'Kailasahar', state: 'Tripura', type: 'Regional' },
  { name: 'Belonia', state: 'Tripura', type: 'Regional' },
  { name: 'Khowai', state: 'Tripura', type: 'Regional' },
  { name: 'Teliamura', state: 'Tripura', type: 'Regional' },
  { name: 'Sabroom', state: 'Tripura', type: 'Regional' },
  { name: 'Amarpur', state: 'Tripura', type: 'Regional' },
  { name: 'Kamalpur', state: 'Tripura', type: 'Regional' },
 
  // Regional Cities - Meghalaya
  { name: 'Shillong', state: 'Meghalaya', type: 'Capital' },
  { name: 'Tura', state: 'Meghalaya', type: 'Regional' },
  { name: 'Jowai', state: 'Meghalaya', type: 'Regional' },
  { name: 'Nongstoin', state: 'Meghalaya', type: 'Regional' },
  { name: 'Williamnagar', state: 'Meghalaya', type: 'Regional' },
  { name: 'Nongpoh', state: 'Meghalaya', type: 'Regional' },
  { name: 'Baghmara', state: 'Meghalaya', type: 'Regional' },
  { name: 'Resubelpara', state: 'Meghalaya', type: 'Regional' },
  { name: 'Mairang', state: 'Meghalaya', type: 'Regional' },
  { name: 'Mawkyrwat', state: 'Meghalaya', type: 'Regional' },
 
  // Regional Cities - Nagaland
  { name: 'Kohima', state: 'Nagaland', type: 'Capital' },
  { name: 'Dimapur', state: 'Nagaland', type: 'Regional' },
  { name: 'Mokokchung', state: 'Nagaland', type: 'Regional' },
  { name: 'Tuensang', state: 'Nagaland', type: 'Regional' },
  { name: 'Wokha', state: 'Nagaland', type: 'Regional' },
  { name: 'Zunheboto', state: 'Nagaland', type: 'Regional' },
  { name: 'Phek', state: 'Nagaland', type: 'Regional' },
  { name: 'Mon', state: 'Nagaland', type: 'Regional' },
  { name: 'Longleng', state: 'Nagaland', type: 'Regional' },
  { name: 'Kiphire', state: 'Nagaland', type: 'Regional' },
 
  // Regional Cities - Manipur
  { name: 'Imphal', state: 'Manipur', type: 'Capital' },
  { name: 'Thoubal', state: 'Manipur', type: 'Regional' },
  { name: 'Bishnupur', state: 'Manipur', type: 'Regional' },
  { name: 'Churachandpur', state: 'Manipur', type: 'Regional' },
  { name: 'Chandel', state: 'Manipur', type: 'Regional' },
  { name: 'Senapati', state: 'Manipur', type: 'Regional' },
  { name: 'Tamenglong', state: 'Manipur', type: 'Regional' },
  { name: 'Ukhrul', state: 'Manipur', type: 'Regional' },
  { name: 'Kangpokpi', state: 'Manipur', type: 'Regional' },
  { name: 'Kakching', state: 'Manipur', type: 'Regional' },
 
  // Regional Cities - Mizoram
  { name: 'Aizawl', state: 'Mizoram', type: 'Capital' },
  { name: 'Lunglei', state: 'Mizoram', type: 'Regional' },
  { name: 'Saiha', state: 'Mizoram', type: 'Regional' },
  { name: 'Champhai', state: 'Mizoram', type: 'Regional' },
  { name: 'Serchhip', state: 'Mizoram', type: 'Regional' },
  { name: 'Kolasib', state: 'Mizoram', type: 'Regional' },
  { name: 'Mamit', state: 'Mizoram', type: 'Regional' },
  { name: 'Lawngtlai', state: 'Mizoram', type: 'Regional' },
  { name: 'Saitual', state: 'Mizoram', type: 'Regional' },
  { name: 'Hnahthial', state: 'Mizoram', type: 'Regional' },
 
  // Regional Cities - Arunachal Pradesh
  { name: 'Itanagar', state: 'Arunachal Pradesh', type: 'Capital' },
  { name: 'Naharlagun', state: 'Arunachal Pradesh', type: 'Regional' },
  { name: 'Pasighat', state: 'Arunachal Pradesh', type: 'Regional' },
  { name: 'Tezu', state: 'Arunachal Pradesh', type: 'Regional' },
  { name: 'Ziro', state: 'Arunachal Pradesh', type: 'Regional' },
  { name: 'Along', state: 'Arunachal Pradesh', type: 'Regional' },
  { name: 'Bomdila', state: 'Arunachal Pradesh', type: 'Regional' },
  { name: 'Tawang', state: 'Arunachal Pradesh', type: 'Regional' },
  { name: 'Khonsa', state: 'Arunachal Pradesh', type: 'Regional' },
  { name: 'Roing', state: 'Arunachal Pradesh', type: 'Regional' }
]
 
// Additional bulk cities to be merged at runtime (deduplicated)
const EXTRA_CITIES: Record<string, string[]> = {
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Haryana": [
    "Faridabad","Gurgaon","Hisar","Rohtak","Panipat","Karnal","Sonipat","Yamunanagar","Panchkula","Bhiwani","Bahadurgarh","Jind","Sirsa","Thanesar","Kaithal","Palwal","Rewari","Hansi","Narnaul","Fatehabad","Gohana","Tohana","Narwana","Mandi Dabwali","Charkhi Dadri","Shahbad","Pehowa","Samalkha","Pinjore","Ladwa","Sohna","Safidon","Taraori","Mahendragarh","Ratia","Rania","Sarsod"
  ],
  "Tamil Nadu": [
    "Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli","Tiruppur","Ranipet","Nagercoil","Thanjavur","Vellore","Kancheepuram","Erode","Tiruvannamalai","Pollachi","Rajapalayam","Sivakasi","Pudukkottai","Neyveli (TS)","Nagapattinam","Viluppuram","Tiruchengode","Vaniyambadi","Theni Allinagaram","Udhagamandalam","Aruppukkottai","Paramakudi","Arakkonam","Virudhachalam","Srivilliputhur","Tindivanam","Virudhunagar","Karur","Valparai","Sankarankovil","Tenkasi","Palani","Pattukkottai","Tirupathur","Ramanathapuram","Udumalaipettai","Gobichettipalayam","Thiruvarur","Thiruvallur","Panruti","Namakkal","Thirumangalam","Vikramasingapuram","Nellikuppam","Rasipuram","Tiruttani","Nandivaram-Guduvancheri","Periyakulam","Pernampattu","Vellakoil","Sivaganga","Vadalur","Rameshwaram","Tiruvethipuram","Perambalur","Usilampatti","Vedaranyam","Sathyamangalam","Puliyankudi","Nanjikottai","Thuraiyur","Sirkali","Tiruchendur","Periyasemur","Sattur","Vandavasi","Tharamangalam","Tirukkoyilur","Oddanchatram","Palladam","Vadakkuvalliyur","Tirukalukundram","Uthamapalayam","Surandai","Sankari","Shenkottai","Vadipatti","Sholingur","Tirupathur","Manachanallur","Viswanatham","Polur","Panagudi","Uthiramerur","Thiruthuraipoondi","Pallapatti","Ponneri","Lalgudi","Natham","Unnamalaikadai","P.N.Patti","Tharangambadi","Tittakudi","Pacode","O' Valley","Suriyampalayam","Sholavandan","Thammampatti","Namagiripettai","Peravurani","Parangipettai","Pudupattinam","Pallikonda","Sivagiri","Punjaipugalur","Padmanabhapuram","Thirupuvanam"
  ],
  "Madhya Pradesh": [
    "Indore","Bhopal","Jabalpur","Gwalior","Ujjain","Sagar","Ratlam","Satna","Murwara (Katni)","Morena","Singrauli","Rewa","Vidisha","Ganjbasoda","Shivpuri","Mandsaur","Neemuch","Nagda","Itarsi","Sarni","Sehore","Mhow Cantonment","Seoni","Balaghat","Ashok Nagar","Tikamgarh","Shahdol","Pithampur","Alirajpur","Mandla","Sheopur","Shajapur","Panna","Raghogarh-Vijaypur","Sendhwa","Sidhi","Pipariya","Shujalpur","Sironj","Pandhurna","Nowgong","Mandideep","Sihora","Raisen","Lahar","Maihar","Sanawad","Sabalgarh","Umaria","Porsa","Narsinghgarh","Malaj Khand","Sarangpur","Mundi","Nepanagar","Pasan","Mahidpur","Seoni-Malwa","Rehli","Manawar","Rahatgarh","Panagar","Wara Seoni","Tarana","Sausar","Rajgarh","Niwari","Mauganj","Manasa","Nainpur","Prithvipur","Sohagpur","Nowrozabad (Khodargama)","Shamgarh","Maharajpur","Multai","Pali","Pachore","Rau","Mhowgaon","Vijaypur","Narsinghgarh"
  ],
  "Jharkhand": [
    "Dhanbad","Ranchi","Jamshedpur","Bokaro Steel City","Deoghar","Phusro","Adityapur","Hazaribag","Giridih","Ramgarh","Jhumri Tilaiya","Saunda","Sahibganj","Medininagar (Daltonganj)","Chaibasa","Chatra","Gumia","Dumka","Madhupur","Chirkunda","Pakaur","Simdega","Musabani","Mihijam","Patratu","Lohardaga","Tenu dam-cum-Kathhara"
  ],
  "Mizoram": ["Aizawl","Lunglei","Saiha"],
  "Nagaland": ["Dimapur","Kohima","Zunheboto","Tuensang","Wokha","Mokokchung"],
  "Himachal Pradesh": ["Shimla","Mandi","Solan","Nahan","Sundarnagar","Palampur","Kullu"],
  "Tripura": ["Agartala","Udaipur","Dharmanagar","Pratapgarh","Kailasahar","Belonia","Khowai"],
  "Andhra Pradesh": [
    "Visakhapatnam","Vijayawada","Guntur","Nellore","Kurnool","Rajahmundry","Kakinada","Tirupati","Anantapur","Kadapa","Vizianagaram","Eluru","Ongole","Nandyal","Machilipatnam","Adoni","Tenali","Chittoor","Hindupur","Proddatur","Bhimavaram","Madanapalle","Guntakal","Dharmavaram","Gudivada","Srikakulam","Narasaraopet","Rajampet","Tadpatri","Tadepalligudem","Chilakaluripet","Yemmiganur","Kadiri","Chirala","Anakapalle","Kavali","Palacole","Sullurpeta","Tanuku","Rayachoti","Srikalahasti","Bapatla","Naidupet","Nagari","Gudur","Vinukonda","Narasapuram","Nuzvid","Markapur","Ponnur","Kandukur","Bobbili","Rayadurg","Samalkot","Jaggaiahpet","Tuni","Amalapuram","Bheemunipatnam","Venkatagiri","Sattenapalle","Pithapuram","Palasa Kasibugga","Parvathipuram","Macherla","Gooty","Salur","Mandapeta","Jammalamadugu","Peddapuram","Punganur","Nidadavole","Repalle","Ramachandrapuram","Kovvur","Tiruvuru","Uravakonda","Narsipatnam","Yerraguntla","Pedana","Puttur","Renigunta","Rajam","Srisailam Project (Right Flank Colony) Township"
  ],
  "Punjab": [
    "Ludhiana","Patiala","Amritsar","Jalandhar","Bathinda","Pathankot","Hoshiarpur","Batala","Moga","Malerkotla","Khanna","Mohali","Barnala","Firozpur","Phagwara","Kapurthala","Zirakpur","Kot Kapura","Faridkot","Muktsar","Rajpura","Sangrur","Fazilka","Gurdaspur","Kharar","Gobindgarh","Mansa","Malout","Nabha","Tarn Taran","Jagraon","Sunam","Dhuri","Firozpur Cantt.","Sirhind Fatehgarh Sahib","Rupnagar","Jalandhar Cantt.","Samana","Nawanshahr","Rampura Phul","Nangal","Nakodar","Zira","Patti","Raikot","Longowal","Urmar Tanda","Morinda, India","Phillaur","Pattran","Qadian","Sujanpur","Mukerian","Talwara"
  ],
  "Chandigarh": ["Chandigarh"],
  "Rajasthan": [
    "Jaipur","Jodhpur","Bikaner","Udaipur","Ajmer","Bhilwara","Alwar","Bharatpur","Pali","Barmer","Sikar","Tonk","Sadulpur","Sawai Madhopur","Nagaur","Makrana","Sujangarh","Sardarshahar","Ladnu","Ratangarh","Nokha","Nimbahera","Suratgarh","Rajsamand","Lachhmangarh","Rajgarh (Churu)","Nasirabad","Nohar","Phalodi","Nathdwara","Pilani","Merta City","Sojat","Neem-Ka-Thana","Sirohi","Pratapgarh","Rawatbhata","Sangaria","Lalsot","Pilibanga","Pipar City","Taranagar","Vijainagar, Ajmer","Sumerpur","Sagwara","Ramganj Mandi","Lakheri","Udaipurwati","Losal","Sri Madhopur","Ramngarh","Rawatsar","Rajakhera","Shahpura","Shahpura","Raisinghnagar","Malpura","Nadbai","Sanchore","Nagar","Rajgarh (Alwar)","Sheoganj","Sadri","Todaraisingh","Todabhim","Reengus","Rajaldesar","Sadulshahar","Sambhar","Prantij","Mount Abu","Mangrol","Phulera","Mandawa","Pindwara","Mandalgarh","Takhatgarh"
  ],
  "Assam": [
    "Guwahati","Silchar","Dibrugarh","Nagaon","Tinsukia","Jorhat","Bongaigaon City","Dhubri","Diphu","North Lakhimpur","Tezpur","Karimganj","Sibsagar","Goalpara","Barpeta","Lanka","Lumding","Mankachar","Nalbari","Rangia","Margherita","Mangaldoi","Silapathar","Mariani","Marigaon"
  ],
  "Odisha": [
    "Bhubaneswar","Cuttack","Raurkela","Brahmapur","Sambalpur","Puri","Baleshwar Town","Baripada Town","Bhadrak","Balangir","Jharsuguda","Bargarh","Paradip","Bhawanipatna","Dhenkanal","Barbil","Kendujhar","Sunabeda","Rayagada","Jatani","Byasanagar","Kendrapara","Rajagangapur","Parlakhemundi","Talcher","Sundargarh","Phulabani","Pattamundai","Titlagarh","Nabarangapur","Soro","Malkangiri","Rairangpur","Tarbha"
  ],
  "Chhattisgarh": [
    "Raipur","Bhilai Nagar","Korba","Bilaspur","Durg","Rajnandgaon","Jagdalpur","Raigarh","Ambikapur","Mahasamund","Dhamtari","Chirmiri","Bhatapara","Dalli-Rajhara","Naila Janjgir","Tilda Newra","Mungeli","Manendragarh","Sakti"
  ],
  "Jammu and Kashmir": ["Srinagar","Jammu","Baramula","Anantnag","Sopore","KathUrban Agglomeration","Rajauri","Punch","Udhampur"],
  "Karnataka": [
    "Bengaluru","Hubli-Dharwad","Belagavi","Mangaluru","Davanagere","Ballari","Mysore","Tumkur","Shivamogga","Raayachuru","Robertson Pet","Kolar","Mandya","Udupi","Chikkamagaluru","Karwar","Ranebennuru","Ranibennur","Ramanagaram","Gokak","Yadgir","Rabkavi Banhatti","Shahabad","Sirsi","Sindhnur","Tiptur","Arsikere","Nanjangud","Sagara","Sira","Puttur","Athni","Mulbagal","Surapura","Siruguppa","Mudhol","Sidlaghatta","Shahpur","Saundatti-Yellamma","Wadi","Manvi","Nelamangala","Lakshmeshwar","Ramdurg","Nargund","Tarikere","Malavalli","Savanur","Lingsugur","Vijayapura","Sankeshwara","Madikeri","Talikota","Sedam","Shikaripur","Mahalingapura","Mudalagi","Muddebihal","Pavagada","Malur","Sindhagi","Sanduru","Afzalpur","Maddur","Madhugiri","Tekkalakote","Terdal","Mudabidri","Magadi","Navalgund","Shiggaon","Shrirangapattana","Sindagi","Sakaleshapura","Srinivaspur","Ron","Mundargi","Sadalagi","Piriyapatna","Adyar"
  ],
  "Manipur": ["Imphal","Thoubal","Lilong","Mayang Imphal"],
  "Kerala": [
    "Thiruvananthapuram","Kochi","Kozhikode","Kollam","Thrissur","Palakkad","Alappuzha","Malappuram","Ponnani","Vatakara","Kanhangad","Taliparamba","Koyilandy","Neyyattinkara","Kayamkulam","Nedumangad","Kannur","Tirur","Kottayam","Kasaragod","Kunnamkulam","Ottappalam","Thiruvalla","Thodupuzha","Chalakudy","Changanassery","Punalur","Nilambur","Cherthala","Perinthalmanna","Mattannur","Shoranur","Varkala","Paravoor","Pathanamthitta","Peringathur","Attingal","Kodungallur","Pappinisseri","Chittur-Thathamangalam","Muvattupuzha","Adoor","Mavelikkara","Mavoor","Perumbavoor","Vaikom","Palai","Panniyannur","Guruvayoor","Puthuppally","Panamattom"
  ],
  "Delhi": ["Delhi","New Delhi"],
  "Dadra and Nagar Haveli": ["Silvassa"],
  "Puducherry": ["Pondicherry","Karaikal","Yanam","Mahe"],
  "Uttarakhand": [
    "Dehradun","Hardwar","Haldwani-cum-Kathgodam","Srinagar","Kashipur","Roorkee","Rudrapur","Rishikesh","Ramnagar","Pithoragarh","Manglaur","Nainital","Mussoorie","Tehri","Pauri","Nagla","Sitarganj","Bageshwar"
  ],
  "Uttar Pradesh": [
    "Lucknow","Kanpur","Firozabad","Agra","Meerut","Varanasi","Bindki","Allahabad","Amroha","Moradabad","Aligarh","Saharanpur","Noida","Loni","Jhansi","Shahjahanpur","Rampur","Modinagar","Hapur","Etawah","Sambhal","Orai","Bahraich","Unnao","Rae Bareli","Lakhimpur","Sitapur","Lalitpur","Pilibhit","Chandausi","Hardoi ","Azamgarh","Khair","Sultanpur","Tanda","Nagina","Shamli","Najibabad","Shikohabad","Sikandrabad","Shahabad, Hardoi","Pilkhuwa","Renukoot","Vrindavan","Ujhani","Laharpur","Tilhar","Sahaswan","Rath","Sherkot","Kalpi","Tundla","Sandila","Nanpara","Sardhana","Nehtaur","Seohara","Padrauna","Mathura","Thakurdwara","Nawabganj","Siana","Noorpur","Sikandra Rao","Puranpur","Rudauli","Thana Bhawan","Palia Kalan","Zaidpur","Nautanwa","Zamania","Shikarpur, Bulandshahr","Naugawan Sadat","Fatehpur Sikri","Shahabad, Rampur","Robertsganj","Utraula","Sadabad","Rasra","Lar","Lal Gopalganj Nindaura","Sirsaganj","Pihani","Shamsabad, Agra","Rudrapur","Soron","SUrban Agglomerationr","Samdhan","Sahjanwa","Rampur Maniharan","Sumerpur","Shahganj","Tulsipur","Tirwaganj","PurqUrban Agglomerationzi","Shamsabad, Farrukhabad","Warhapur","Powayan","Sandi","Achhnera","Naraura","Nakur","Sahaspur","Safipur","Reoti","Sikanderpur","Saidpur","Sirsi","Purwa","Parasi","Lalganj","Phulpur","Shishgarh","Sahawar","Samthar","Pukhrayan","Obra","Niwai","Mirzapur"
  ],
  "Bihar": [
    "Patna","Gaya","Bhagalpur","Muzaffarpur","Darbhanga","Arrah","Begusarai","Chhapra","Katihar","Munger","Purnia","Saharsa","Sasaram","Hajipur","Dehri-on-Sone","Bettiah","Motihari","Bagaha","Siwan","Kishanganj","Jamalpur","Buxar","Jehanabad","Aurangabad","Lakhisarai","Nawada","Jamui","Sitamarhi","Araria","Gopalganj","Madhubani","Masaurhi","Samastipur","Mokameh","Supaul","Dumraon","Arwal","Forbesganj","BhabUrban Agglomeration","Narkatiaganj","Naugachhia","Madhepura","Sheikhpura","Sultanganj","Raxaul Bazar","Ramnagar","Mahnar Bazar","Warisaliganj","Revelganj","Rajgir","Sonepur","Sherghati","Sugauli","Makhdumpur","Maner","Rosera","Nokha","Piro","Rafiganj","Marhaura","Mirganj","Lalganj","Murliganj","Motipur","Manihari","Sheohar","Maharajganj","Silao","Barh","Asarganj"
  ],
  "Gujarat": [
    "Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Nadiad","Porbandar","Anand","Morvi","Mahesana","Bharuch","Vapi","Navsari","Veraval","Bhuj","Godhra","Palanpur","Valsad","Patan","Deesa","Amreli","Anjar","Dhoraji","Khambhat","Mahuva","Keshod","Wadhwan","Ankleshwar","Savarkundla","Kadi","Visnagar","Upleta","Una","Sidhpur","Unjha","Mangrol","Viramgam","Modasa","Palitana","Petlad","Kapadvanj","Sihor","Wankaner","Limbdi","Mandvi","Thangadh","Vyara","Padra","Lunawada","Rajpipla","Vapi","Umreth","Sanand","Rajula","Radhanpur","Mahemdabad","Ranavav","Tharad","Mansa","Umbergaon","Talaja","Vadnagar","Manavadar","Salaya","Vijapur","Pardi","Rapar","Songadh","Lathi","Adalaj","Chhapra","Gandhinagar"
  ],
  "Telangana": [
    "Hyderabad","Warangal","Nizamabad","Karimnagar","Ramagundam","Khammam","Mahbubnagar","Mancherial","Adilabad","Suryapet","Jagtial","Miryalaguda","Nirmal","Kamareddy","Kothagudem","Bodhan","Palwancha","Mandamarri","Koratla","Sircilla","Tandur","Siddipet","Wanaparthy","Kagaznagar","Gadwal","Sangareddy","Bellampalle","Bhongir","Vikarabad","Jangaon","Bhadrachalam","Bhainsa","Farooqnagar","Medak","Narayanpet","Sadasivpet","Yellandu","Manuguru","Kyathampalle","Nagarkurnool"
  ],
  "Meghalaya": ["Shillong","Tura","Nongstoin"],
  "Himachal Praddesh": ["Manali"],
  "Arunachal Pradesh": ["Naharlagun","Pasighat"],
  "Maharashtra": [
    "Mumbai","Pune","Nagpur","Thane","Nashik","Kalyan-Dombivali","Vasai-Virar","Solapur","Mira-Bhayandar","Bhiwandi","Amravati","Nanded-Waghala","Sangli","Malegaon","Akola","Latur","Dhule","Ahmednagar","Ichalkaranji","Parbhani","Panvel","Yavatmal","Achalpur","Osmanabad","Nandurbar","Satara","Wardha","Udgir","Aurangabad","Amalner","Akot","Pandharpur","Shrirampur","Parli","Washim","Ambejogai","Manmad","Ratnagiri","Uran Islampur","Pusad","Sangamner","Shirpur-Warwade","Malkapur","Wani","Lonavla","Talegaon Dabhade","Anjangaon","Umred","Palghar","Shegaon","Ozar","Phaltan","Yevla","Shahade","Vita","Umarkhed","Warora","Pachora","Tumsar","Manjlegaon","Sillod","Arvi","Nandura","Vaijapur","Wadgaon Road","Sailu","Murtijapur","Tasgaon","Mehkar","Yawal","Pulgaon","Nilanga","Wai","Umarga","Paithan","Rahuri","Nawapur","Tuljapur","Morshi","Purna","Satana","Pathri","Sinnar","Uchgaon","Uran","Pen","Karjat","Manwath","Partur","Sangole","Mangrulpir","Risod","Shirur","Savner","Sasvad","Pandharkaoda","Talode","Shrigonda","Shirdi","Raver","Mukhed","Rajura","Vadgaon Kasba","Tirora","Mahad","Lonar","Sawantwadi","Pathardi","Pauni","Ramtek","Mul","Soyagaon","Mangalvedhe","Narkhed","Shendurjana","Patur","Mhaswad","Loha","Nandgaon","Warud"
  ],
  "Goa": ["Marmagao","Panaji","Margao","Mapusa"],
  "West Bengal": [
    "Kolkata","Siliguri","Asansol","Raghunathganj","Kharagpur","Naihati","English Bazar","Baharampur","Hugli-Chinsurah","Raiganj","Jalpaiguri","Santipur","Balurghat","Medinipur","Habra","Ranaghat","Bankura","Nabadwip","Darjiling","Purulia","Arambagh","Tamluk","AlipurdUrban Agglomerationr","Suri","Jhargram","Gangarampur","Rampurhat","Kalimpong","Sainthia","Taki","Murshidabad","Memari","Paschim Punropara","Tarakeswar","Sonamukhi","PandUrban Agglomeration","Mainaguri","Malda","Panchla","Raghunathpur","Mathabhanga","Monoharpur","Srirampore","Adra"
  ]
}
 
// Normalize state name differences between sources
const STATE_NAME_MAP: Record<string, string> = {
  'Andaman and Nicobar Islands': 'Andaman & Nicobar',
  'Jammu and Kashmir': 'Jammu & Kashmir',
  'Dadra and Nagar Haveli': 'Dadra & Nagar Haveli',
  'Himachal Praddesh': 'Himachal Pradesh'
}
 
// Merge EXTRA_CITIES into INDIAN_CITIES without duplicates
;(function mergeExtraCities() {
  const hasEntry = (name: string, state: string) =>
    INDIAN_CITIES.some(
      c => c.name.toLowerCase() === name.toLowerCase() && c.state.toLowerCase() === state.toLowerCase()
    )
 
  Object.entries(EXTRA_CITIES).forEach(([stateName, cities]) => {
    const normalizedState = STATE_NAME_MAP[stateName] || stateName
    cities.forEach(city => {
      if (!hasEntry(city, normalizedState)) {
        INDIAN_CITIES.push({ name: city, state: normalizedState, type: 'Regional' })
      }
    })
  })
})()
 
// Ensure uniqueness by (name,state) to avoid duplicate keys in UI
;(function dedupeCities() {
  const seen = new Set<string>()
  const unique: IndianCity[] = []
  for (const city of INDIAN_CITIES) {
    const key = `${city.name.toLowerCase()}|${city.state.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(city)
    }
  }
  INDIAN_CITIES.length = 0
  INDIAN_CITIES.push(...unique)
})()
 
// Helper function to search cities
export function searchCities(query: string): IndianCity[] {
  const searchTerm = query.toLowerCase().trim()
  if (!searchTerm) return []
 
  const results = INDIAN_CITIES.filter(city =>
    city.name.toLowerCase().includes(searchTerm) ||
    city.state.toLowerCase().includes(searchTerm)
  )
  
  // Sort results to prioritize cities that start with the search term
  return results.sort((a, b) => {
    const aStartsWith = a.name.toLowerCase().startsWith(searchTerm)
    const bStartsWith = b.name.toLowerCase().startsWith(searchTerm)
    
    if (aStartsWith && !bStartsWith) return -1
    if (!aStartsWith && bStartsWith) return 1
    return 0
  }).slice(0, 20) // Limit to 20 results
}
 
// Get cities by state
export function getCitiesByState(state: string): IndianCity[] {
  return INDIAN_CITIES.filter(city =>
    city.state.toLowerCase() === state.toLowerCase()
  )
}
 
// Get all states
export function getAllStates(): string[] {
  return [...new Set(INDIAN_CITIES.map(city => city.state))].sort()
}
 
// Get cities by type
export function getCitiesByType(type: 'Metropolitan' | 'Capital' | 'Major' | 'Regional'): IndianCity[] {
  return INDIAN_CITIES.filter(city => city.type === type)
}