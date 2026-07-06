const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const facultyData = [
  {"full_name":"Mrs.Sneha Jigneshkumar Patel","email":"mrs@rngpit.ac.in"},
  {"full_name":"Ketan Pravinbhai Patel","email":"ketan@rngpit.ac.in"},
  {"full_name":"Lakshmiben Ramashankar Prajapati","email":"lakshmiben@rngpit.ac.in"},
  {"full_name":"Piyush Ratilal Nakum","email":"piyush@rngpit.ac.in"},
  {"full_name":"Sapan Hitenkumar Joshi","email":"sapan@rngpit.ac.in"},
  {"full_name":"Shobhit Yogeshkumar Varshney","email":"shobhit@rngpit.ac.in"},
  {"full_name":"Ashka Arjunsinh Chauhan","email":"ashka@rngpit.ac.in"},
  {"full_name":"Mr.Yash Bharatkumar Naik","email":"yash@rngpit.ac.in"},
  {"full_name":"Uzmabanu M. Shekh","email":"uzmabanu@rngpit.ac.in"},
  {"full_name":"Hilay Prajapati","email":"hilay@rngpit.ac.in"},
  {"full_name":"Dr.Kamalsinh M. Padhiar","email":"kamalsinh@rngpit.ac.in"},
  {"full_name":"Bharatkumar J. Prajapati","email":"bharatkumar@rngpit.ac.in"},
  {"full_name":"Nupur Vyom Pathak","email":"nupur@rngpit.ac.in"},
  {"full_name":"Trupti Dineshbhai Desai","email":"trupti@rngpit.ac.in"},
  {"full_name":"Megha S. Makwana","email":"megha@rngpit.ac.in"},
  {"full_name":"Dhaval Dilipbhai Patel","email":"dhaval@rngpit.ac.in"},
  {"full_name":"Parikshit Pravinbhai Rathod","email":"parikshit@rngpit.ac.in"},
  {"full_name":"Kinjal Pandya","email":"kinjal@rngpit.ac.in"},
  {"full_name":"Patel Shubhamkumar Dineshbhai","email":"patel@rngpit.ac.in"},
  {"full_name":"Amitkumar P. Patel","email":"amitkumar@rngpit.ac.in"},
  {"full_name":"Nishtha Ashutoshkumar Upadhyay","email":"nishtha@rngpit.ac.in"},
  {"full_name":"Ravikumar Mulchandbhai Sen","email":"ravikumar@rngpit.ac.in"},
  {"full_name":"Jigneshbhai Mistry","email":"jigneshbhai@rngpit.ac.in"},
  {"full_name":"Krina N. Desai","email":"krina@rngpit.ac.in"},
  {"full_name":"Foram C. Shukla","email":"foram@rngpit.ac.in"},
  {"full_name":"Poojaben Dipakbhai Patel","email":"poojaben@rngpit.ac.in"},
  {"full_name":"Sushantkumar Kiritbhai Merai","email":"sushantkumar@rngpit.ac.in"},
  {"full_name":"Zeel Bhatt","email":"zeel@rngpit.ac.in"},
  {"full_name":"Ayushi H. Gandhi","email":"ayushi@rngpit.ac.in"},
  {"full_name":"Vivekkumar Rakeshbhai Ayre","email":"vivekkumar@rngpit.ac.in"},
  {"full_name":"Bhumin Pathak","email":"bhumin@rngpit.ac.in"},
  {"full_name":"Parekh Vrunda Dharmendrakumar","email":"parekh@rngpit.ac.in"},
  {"full_name":"Shah Margi Kamleshkumar","email":"shah@rngpit.ac.in"},
  {"full_name":"Ankursinh Pravinsinh Solanki","email":"ankursinh@rngpit.ac.in"},
  {"full_name":"Riddhi Mistry","email":"riddhi@rngpit.ac.in"},
  {"full_name":"Smita Chaudhary","email":"smita@rngpit.ac.in"},
  {"full_name":"Parth Dineshbhai Patel","email":"parth@rngpit.ac.in"},
  {"full_name":"Hardi A. Patel","email":"hardi@rngpit.ac.in"},
  {"full_name":"Bhavesh  G. Tailor","email":"bhavesh@rngpit.ac.in"},
  {"full_name":"Desai Chinmay Dipakbhai","email":"desai@rngpit.ac.in"},
  {"full_name":"Ketankumar Mansukhbhai Chauhan","email":"ketankumar@rngpit.ac.in"},
  {"full_name":"Ms.Vrundali Chhibubhai Patel","email":"vrundali@rngpit.ac.in"},
  {"full_name":"Monali R. Gandhi","email":"monali@rngpit.ac.in"},
  {"full_name":"Mr.Mohammed A. Qureshi","email":"mohammed@rngpit.ac.in"},
  {"full_name":"Yadav Saritakumari Harishankar","email":"yadav@rngpit.ac.in"},
  {"full_name":"Lad Jenishkumar Pankajbhai","email":"lad@rngpit.ac.in"},
  {"full_name":"Mr.Hemanshu Pravinchandra Patel","email":"hemanshu@rngpit.ac.in"},
  {"full_name":"Parmar Yagniksinh Ratnasinh","email":"parmar@rngpit.ac.in"},
  {"full_name":"Santoshkumar Pravinbhai Patel","email":"santoshkumar@rngpit.ac.in"},
  {"full_name":"Pratixa T. Rathod","email":"pratixa@rngpit.ac.in"},
  {"full_name":"Mr.Ankit Dhansukhbhai Prajapati","email":"ankit@rngpit.ac.in"},
  {"full_name":"Umeshkumar Champakbhai Prajapati","email":"umeshkumar@rngpit.ac.in"},
  {"full_name":"Zubair Umarbhai Mansuri","email":"zubair@rngpit.ac.in"},
  {"full_name":"Asmita Chandrakant Patel","email":"asmita@rngpit.ac.in"},
  {"full_name":"Prajapati Jigneshkumar Rameshbhai","email":"prajapati@rngpit.ac.in"},
  {"full_name":"Ms.Dishaben Vasantkumar Rana","email":"dishaben@rngpit.ac.in"},
  {"full_name":"Heli Sanjaybhai Mehta","email":"heli@rngpit.ac.in"},
  {"full_name":"Rinisha Patel","email":"rinisha@rngpit.ac.in"},
  {"full_name":"SHIS TUSHAR MAHETA","email":"shistusharmaheta@rngpit.ac.in"},
  {"full_name":"Niyati Vasantbhai Aghera","email":"niyati@rngpit.ac.in"},
  {"full_name":"Salunke Nirav Avdhutkumar","email":"salunke@rngpit.ac.in"},
  {"full_name":"Ms.Daxa Khapubhai Patel","email":"daxa@rngpit.ac.in"},
  {"full_name":"Ajay B. Patel","email":"ajay@rngpit.ac.in"},
  {"full_name":"Mr.Rohan Mukeshbhai Desai","email":"rohan@rngpit.ac.in"},
  {"full_name":"Kenilkumar Malkeshbhai Panchal","email":"kenilkumar@rngpit.ac.in"},
  {"full_name":"Urjitkumar Hareshchandra Bhatt","email":"urjitkumar@rngpit.ac.in"},
  {"full_name":"Kajal Jayeshbhai Patel","email":"kajal@rngpit.ac.in"},
  {"full_name":"yatin chauhan","email":"yatin@rngpit.ac.in"},
  {"full_name":"Riya Viral Desai","email":"riya@rngpit.ac.in"},
  {"full_name":"Mr.Priyank H. Patel","email":"priyank@rngpit.ac.in"},
  {"full_name":"Dharmin Patel","email":"dharmin@rngpit.ac.in"},
  {"full_name":"Nikunjkumar Dipakbhai Khatri","email":"nikunjkumar@rngpit.ac.in"},
  {"full_name":"Mr.Sharukh M. Marfani","email":"sharukh@rngpit.ac.in"},
  {"full_name":"Ms.Kamiyakumari Vasantbhai Patel","email":"kamiyakumari@rngpit.ac.in"},
  {"full_name":"Dharmishtha Raj Chaudhari","email":"dharmishtha@rngpit.ac.in"},
  {"full_name":"Amishkumar Babubhai Patel","email":"amishkumar@rngpit.ac.in"},
  {"full_name":"Ms.Bhavini Rajendrakumar Bhatt","email":"bhavini@rngpit.ac.in"},
  {"full_name":"Nirav P. Desai","email":"nirav@rngpit.ac.in"},
  {"full_name":"Mistry Rinkal Harishbhai","email":"mistry@rngpit.ac.in"},
  {"full_name":"Gamit Jigisha Bipinbhai","email":"gamit@rngpit.ac.in"}
];

const processed = facultyData.map(f => {
  const prefix = f.email.split('@')[0];
  return {
    'Faculty Name': f.full_name,
    'Email Address': f.email,
    'Login Password': `${prefix}@1234`
  };
});

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(processed);
xlsx.utils.book_append_sheet(wb, ws, "Faculties");

const outputPath = path.join(__dirname, '../../FACULTY_CREDS_LATEST.xlsx');
xlsx.writeFile(wb, outputPath);

console.log(`Excel file created successfully at: ${outputPath}`);
