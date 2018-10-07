const applicationServerPublicKey = "BGTM7lyGIz-AZI4nIAqnV-vVuqHEDl7MwKoJu0smoxE1aUCNYTBUM6VHIe5muI0qffUrBr82l5i3ViiHkr9ZWJs";
const pushButton = document.querySelector('.js-push-btn');


let isSubscribed = false;
let swRegistration = null;

// Check for service worker
if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('Service Worker and Push is supported');

  navigator.serviceWorker.register('service-worker.js')
  .then(function(swReg) {
    console.log('Service Worker is registered');

    swRegistration = swReg;
    initializeUI();
    
  })
  .catch(function(error) {
    console.error('Service Worker Error', error);
  });
} else {
  console.warn('Push messaging is not supported');
  pushButton.textContent = 'Notifs Not Supported';
}




function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


function initializeUI() {
    pushButton.addEventListener('click', function() {
    pushButton.disabled = true;
    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  });

  // Set the initial subscription value
  swRegistration.pushManager.getSubscription()
  .then(function(subscription) {
    isSubscribed = !(subscription === null);

    if (isSubscribed) {
      console.log('User IS subscribed.');
    } else {
      console.log('User is NOT subscribed.');
    }

    updateBtn();
  });
}



function updateBtn() {
  if (Notification.permission === 'denied') {
    pushButton.textContent = 'Notifications Blocked.';
    pushButton.disabled = true;
    updateSubscriptionOnServer(null);
    return;
  }	
  if (isSubscribed) {
    pushButton.textContent = 'Disable Push Messaging';
  } else {
    pushButton.textContent = 'Enable Push Messaging';
  }

  pushButton.disabled = false;
  if(!navigator.onLine){
    pushButton.disabled = true;
    pushButton.textContent = 'You are Offline'
  }
}

function subscribeUser() {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  })
  .then(function(subscription) {
    console.log('User is subscribed.');

    updateSubscriptionOnServer(subscription);
    isSubscribed = true;

    updateBtn();
  })
  .catch(function(err) {
    console.log('Failed to subscribe the user: ', err);
    updateBtn();
  });
}



function updateSubscriptionOnServer(subscription) {
  // TODO: Send subscription to application server
	fetch('/subscribe',{
		method: 'POST',
		body: JSON.stringify(subscription),
		headers:{
			'content-type': 'application/json'
		}
	});
	console.log('Updated Subscription On Server')
    

}
function deleteSubscriptionOnServer(subscription) {
  // TODO: delete subscription from application server
	fetch('/unsubscribe',{
		method: 'POST',
		body: JSON.stringify(subscription),
		headers:{
			'content-type': 'application/json'
		}
	});
	console.log('Deleted Subscription From Server')
    

}
function unsubscribeUser() {
  swRegistration.pushManager.getSubscription()
  .then(function(subscription) {
    if (subscription) {
      // TODO: Tell application server to delete subscription
      deleteSubscriptionOnServer(subscription);
      return subscription.unsubscribe();
    }
  })
  .catch(function(error) {
    console.log('Error unsubscribing', error);
  })
  .then(function() {
    // updateSubscriptionOnServer(null);

    console.log('User is unsubscribed.');
    isSubscribed = false;

    updateBtn();
  });
}

