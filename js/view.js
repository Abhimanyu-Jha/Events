function getData(){
    var xmlhttp= new XMLHttpRequest;
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var data=this.responseText;
            data= JSON.parse(data);
            
            var i=0;
            while(i<data.length){
              tablize(data[i]); 
              i++;
            };
        
        };
    };
    xmlhttp.open('GET', '/data', true);
    xmlhttp.send();   

    table_body =document.getElementById('table_body');
    trow=document.querySelector('.table_row');

}  


function tablize(data){
    // console.log(data);
    row = trow.cloneNode(true);
    //FORMATING DATE
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        edate=new Date(data.date);
        dayName = edate.toString().split(' ')[0];
        monthName= monthNames[edate.getMonth()];
        d= edate.getDate();
        function nth(d) {
            if(d>3 && d<21) return 'th'; 
            switch (d % 10) {
                  case 1:  return "st";
                  case 2:  return "nd";
                  case 3:  return "rd";
                  default: return "th";
              }
          }
        function formatAMPM(date) {
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            var strTime = hours + ':' + minutes + '' + ampm;
            return strTime;
        }
        time=formatAMPM(edate);
        edate=dayName+' '+monthName+' '+d+nth(d)+' '+time;
    //DONE FORMATTING USE EDATE instead of data.date


    row.querySelector('.key').textContent=data.key;
    row.querySelector('.title').textContent=data.title;
    row.querySelector('.date').textContent=edate;
    row.querySelector('.venue').textContent=data.venue;
    row.querySelector('.club').textContent=data.club;
    row.querySelector('.edit').setAttribute('href',data.club+'/edit/'+data.key);
    row.querySelector('.delete').setAttribute('href',data.club+'/delete/'+data.key);
    row.querySelector('.title').setAttribute('href','/knowmore/'+data.key);
    row.removeAttribute('hidden');

    table_body.appendChild(row);
};

getData();


// function delete_event(){
//     var x =confirm('Do you want to delete this event ?');
//     console.log(this.class);

//     if(x){

//     var xmlhttp= new XMLHttpRequest;
//     xmlhttp.open('GET', '/delete', true);
//     xmlhttp.send(); 

//     };
// };