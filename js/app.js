// alert("script chalu hai");
var app = {
    isLoading: true,
    visibleCards: {},
    visibleAgenda: {},
    spinners: document.getElementsByClassName("loader"),
    cardTemplate: document.querySelector('.mdl-card'),
    agendaTemplate: document.querySelector('.agenda-card'),
    padder: document.querySelector('.padder'),
    padder2:document.querySelector('.padder2'),
    container: document.querySelector('.page-content1'),
    container2: document.querySelector('.page-content2')
};

/*****************************************************************************
*
* Methods to update/refresh the UI
*
****************************************************************************/


// Updates an event card with the latest info. If the card
// doesn't already exist, it's cloned from the template.

app.updateEventCard = function(data) {
    var dataLastUpdated = new Date(data.created);
    
    var card = app.visibleCards[data.key];
    var acard= app.visibleAgenda[data.key];

    if (!card) {
      card = app.cardTemplate.cloneNode(true);
      paddy= app.padder.cloneNode(true);
      //card.classList.remove('cardTemplate');
      card.querySelector('.card-key').textContent = data.key;
      card.querySelector('.know-more').setAttribute("href","/knowmore/"+data.key);
      card.querySelector('.mdl-card__title-text').textContent = data.title;
      card.querySelector('.card-subheading').textContent = data.date;
      if (data.description.length>170){
        short_desc =data.description.slice(0,170);
        short_desc = short_desc.substr(0, Math.min(short_desc.length, short_desc.lastIndexOf(" ")));
      }else{
        short_desc=data.description
      }
      
      card.querySelector('.desc').textContent = short_desc; //ONLY 170 CHARS  HERE
      card.querySelector('.mdl-card__title').setAttribute("style","background: url('../images/"+data.img+"') center / cover;");
      card.querySelector('.club-name').textContent='By '+data.club;

        // SENDING INFO TO GOOGLE CALENDAR
          edate=new Date(data.date);
          month=edate.getMonth()+1;
          month = month < 10 ? '0'+month : month;
          d=edate.getDate();
          d = d < 10 ? '0'+d : d;
          start_date=String(edate.getFullYear())+String(month)+String(d);
          // console.log(start_date);
          hh=edate.getHours();
          jj=hh+1;
          jj = jj < 10 ? '0'+jj : jj;
          hh = hh < 10 ? '0'+hh : hh;
          mm=edate.getMinutes();
          mm = mm < 10 ? '0'+mm : mm;
          ss=edate.getSeconds();
          ss = ss < 10 ? '0'+ss : ss;
          start_time=String(hh)+String(mm)+String(ss);
          end_time=String(jj)+String(mm)+String(ss);

          card.querySelector('.calendar-button').setAttribute("onclick","location.href ='https://www.google.com/calendar/render?action=TEMPLATE&text="+data.title+"&dates="+start_date+"T"+start_time+"/"+start_date+"T"+end_time+"&details="+data.club+" Event,+For+details,+link+here:+http://www.example.com&location=IIIT+Delhi+Okhla&trp=false&sf=true&output=xml';");
         // SENDING INFO TO GOOGLE CALENDAR close

      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.container.appendChild(paddy);
      app.visibleCards[data.key] = card;
      // console.log(app.visibleCards);
    }
    if (!acard){
      
      acard = document.querySelector('.agenda-card').cloneNode(true);
      apaddy= document.querySelector('.padder2').cloneNode(true);

      acard.querySelector('.agenda-button').setAttribute("onclick","location.href='/knowmore/"+data.key+"'");
      acard.querySelector('.agenda-heading').textContent = data.title;

      acard.querySelector('.agenda-date').textContent = data.date;
      acard.querySelector('.agenda-img-content').setAttribute("src","images/"+data.img);
      acard.querySelector('.agenda-club').textContent='By '+data.club;
      acard.querySelector('.agenda-img-content').setAttribute("src","images/"+data.img);

      color=(data.order%4) +1;
      acard.classList.add('agenda'+color);


      acard.removeAttribute('hidden');
      app.container2.appendChild(acard);
      app.container2.appendChild(apaddy);
      app.visibleAgenda[data.key] = acard;
      
    }

  // Verifies the data provide is newer than what's already visible
  // on the card, if it's not bail, if it is, continue and update the
  // time saved in the card

  
  var cardLastUpdated = card.querySelector('.card-last-updated').textContent;
  if (cardLastUpdated) {
    cardLastUpdated = new Date(cardLastUpdated);
    
    // Bail if the card has more recent data then the data
    if (dataLastUpdated.getTime() < cardLastUpdated.getTime()) {
      return;
    }
  }


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




  card.querySelector('.card-last-updated').textContent = new Date(data.created);
  

  acard.querySelector('.agenda-button').setAttribute("onclick","location.href='/knowmore/"+data.key+"'");
  // console.log('updating agenda data after refresh');
 
 
  acard.querySelector('.agenda-heading').textContent = data.title;
  acard.querySelector('.agenda-date').textContent = edate;
  acard.querySelector('.agenda-img-content').setAttribute("src","images/"+data.img);
  acard.querySelector('.agenda-club').textContent='By '+data.club;

  card.querySelector('.card-key').textContent = data.key;
  card.querySelector('.mdl-card__title-text').textContent = data.title;
  
  card.querySelector('.card-subheading').textContent = edate;
  if (data.description.length>170){
        short_desc =data.description.slice(0,170);
        short_desc = short_desc.substr(0, Math.min(short_desc.length, short_desc.lastIndexOf(" ")));
        short_desc += ' ...'
      }
  else{
        short_desc=data.description
      }
      
  card.querySelector('.desc').textContent = short_desc; //ONLY 170 CHARS  HERE
  card.querySelector('.mdl-card__title').setAttribute("style","background: url('../images/"+data.img+"') center / cover;");
  card.querySelector('.club-name').textContent='By '+data.club;

  // SENDING INFO TO GOOGLE CALENDAR
    edate=new Date(data.date);
    month=edate.getMonth()+1;
    month = month < 10 ? '0'+month : month;
    d=edate.getDate();
    d = d < 10 ? '0'+d : d;
    start_date=String(edate.getFullYear())+String(month)+String(d);
    // console.log(start_date);
    hh=edate.getHours();
    jj=hh+1;
    jj = jj < 10 ? '0'+jj : jj;
    hh = hh < 10 ? '0'+hh : hh;
    mm=edate.getMinutes();
    mm = mm < 10 ? '0'+mm : mm;
    ss=edate.getSeconds();
    ss = ss < 10 ? '0'+ss : ss;
    start_time=String(hh)+String(mm)+String(ss);
    end_time=String(jj)+String(mm)+String(ss);

    card.querySelector('.calendar-button').setAttribute("onclick","location.href ='https://www.google.com/calendar/render?action=TEMPLATE&text="+data.title+"&dates="+start_date+"T"+start_time+"/"+start_date+"T"+end_time+"&details="+data.club+" Event,+For+details,+link+here:+http://www.example.com&location=IIIT+Delhi+Okhla&trp=false&sf=true&output=xml';");
  // SENDING INFO TO GOOGLE CALENDAR close
  if (app.isLoading) {
    app.spinners[0].setAttribute('hidden', true);
    app.spinners[1].setAttribute('hidden', true);
    // app.spinners[2].setAttribute('hidden', true);
    app.container.removeAttribute('hidden');
    app.isLoading = false;
  }

  

};

app.getEvent = function(firstCall) {
    // Fetch the latest data.
    document.querySelector('.refresh').classList.add('spin');
    
    function formatAMPM(date) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var seconds = date.getSeconds();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0'+minutes : minutes;
      var strTime = hours + ':' + minutes + ':'+seconds + ampm;
      return strTime;
    }
    
    var today = new Date();
    time=formatAMPM(today);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dd = today.getDate();
    var mm = monthNames[today.getMonth()];
    

   
    if(dd<10){
      dd='0'+dd;
    } 
    if(mm<10){
      mm='0'+mm;
    }
    var curr_date = dd+' '+mm;
    
    var curr_date_time= curr_date+' '+time;
    
    var xmlhttp= new XMLHttpRequest;
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        var data=this.responseText;
        data= JSON.parse(data);
        
        var i=0;
        keyarr=[];
        while(i<data.length){
          keyarr[i]=parseInt([data[i].key]);
          data[i].order=i;
          // console.log(data[i]);
          app.updateEventCard(data[i]); //THIS FUNCTION'S ONLY PURPOSE IS TO GET DATA AND SEND IT TO UPDATE EVENT FUNCTION T0 RENDER DATA ON PAGE
          i++;
        };
        if(!navigator.onLine){
          document.getElementById('update_time').textContent='Go online to receive latest content';
         return;
        } 
        document.getElementById('update_time').textContent='Last Updated '+curr_date_time;
        // console.log('length of data JSON is '+ data.length);
        //check if key is still in db else delete
        // DELETE IF NOT IN DB

          card=document.getElementsByName('card');
          acard=document.getElementsByName('acard')
          var i=1;
          while(i<card.length){
            key= parseInt(card[i].querySelector('.card-key').textContent);
            
            if (keyarr.includes(key)){
              // console.log(key + ' IS in DB');
              
            } else{
              // console.log(key + ' is NOT in DB, removing card');
              card[i].parentNode.removeChild(card[i]);
              acard[i].parentNode.removeChild(acard[i]);
            }  
            
            i++;
          }
        // DELETE IF NOT IN DB CLOSE
      
      var lastupdate=document.getElementById('update_time');
      lastupdate.classList.add('backgroundAnimated');
      async function removebg(){
      setTimeout(function(){ 
      lastupdate.classList.remove('backgroundAnimated'); 
      document.querySelector('.refresh').classList.remove('spin');
      }, 1000);
      }
      removebg();
      }
    };


    xmlhttp.open('GET', '/data', true);
    xmlhttp.send();    
   
};




// var checkExist = setInterval(function() {
//    if (document.querySelector('.refresh')) {
//       console.log("Header Exists!");
//       app.getEvent();
//       clearInterval(checkExist);
//    }else{
//     console.log('doesnt exist')
//    }
// }, 100);

app.getEvent();




