const serverloc='https://localhost';var tok_timerid=null;function checkAccessTok(){return!!(accesstoken!==null&&accesstoken!=='')}function login(){$.ajax({url:serverloc+'/api/account/login',type:'POST',contentType:'application/json',data:JSON.stringify({username:$('#login-username').val(),password:$('#login-password').val()}),xhrFields:{withCredentials:!0},success:function(a,c,b){b.status==200?(console.log('login successful'),accesstoken=a.slice(1,-2),tok_timerid&&clearInterval(tok_timerid),tok_timerid=setInterval(function(){refreshAccessToken()},240*1e3)):(console.log('login has failed'),alert('login has failed'),accesstoken=''),$('#login-username').val(''),$('#login-password').val(''),enableLogoutRomSaveQuickServerMenuNodes()},error:function(a,b,c){a.readyState==0?navigator.onLine?(console.log('login has failed'),alert('login has failed')):(console.log('login request has failed..no connect..'),offlineEnableRomSaveServerMenuNodes(),accesstoken='offline_first_dummy'):(console.log('login request has failed'),alert('login request has failed')),$('#login-username').val(''),$('#login-password').val('')}})}function logout(){if(!checkAccessTok())return;$.ajax({url:serverloc+'/api/account/logout',type:'POST',headers:{Authorization:'Bearer '+accesstoken},xhrFields:{withCredentials:!0},success:function(b,c,a){a.status==200?(console.log('logout successful'),disableLogoutRomSaveServerMenuNodes(),accesstoken=''):(console.log('logout has failed'),alert('logout has failed')),tok_timerid&&clearInterval(tok_timerid)},error:function(a,b,c){console.log('unable to reach server, logout failed'),alert('unable to reach server, logout failed')}})}function loadRomFromServer(b){if(!checkAccessTok())return;var a=new XMLHttpRequest;a.open('GET',serverloc+'/api/rom/download?rom='+encodeURIComponent(b)),a.setRequestHeader('Authorization','Bearer '+accesstoken),a.responseType='blob',a.onload=function(){a.status==200?(localStorage.setItem('current-loaded-rom-filename',b),a.response.name=b,run(a.response,!0)):(console.log('Your fetch has failed, please check with your server owner'),alert('Your fetch has failed, please check with your server owner'))},a.send()}function loadSaveFromServer(b){if(!checkAccessTok())return;var a=new XMLHttpRequest;a.open('GET',serverloc+'/api/save/download?save='+encodeURIComponent(b)),a.setRequestHeader('Authorization','Bearer '+accesstoken),a.responseType='blob',a.onload=function(){a.status==200?(localStorage.setItem('current-loaded-save-filename',b),a.response.name=b,uploadSavedataPending(a.response)):(console.log('Your fetch has failed, please check with your server owner'),alert('Your fetch has failed, please check with your server owner'))},a.send()}function uploadRomToServer(){var a,b;if(!checkAccessTok())return;a=$('#loader')[0].files,a.length>0&&(b=new FormData,b.append('rom',a[0]),$.ajax({url:serverloc+'/api/rom/upload',type:'post',data:b,headers:{Authorization:'Bearer '+accesstoken},contentType:!1,processData:!1,success:function(b,c,a){a.status==200?(alert('upload rom has succeeded'),console.log('upload rom has succeeded')):(alert('upload rom has failed'),console.log('upload rom has failed'))},error:function(a,b,c){console.log('unable to reach server, upload rom failed'),alert('unable to reach server, upload rom failed')}}))}function uploadSaveToServer(){var a,b;if(!checkAccessTok())return;a=$('#saveloader')[0].files,a.length>0&&(b=new FormData,b.append('save',a[0]),$.ajax({url:serverloc+'/api/save/upload',type:'post',data:b,headers:{Authorization:'Bearer '+accesstoken},contentType:!1,processData:!1,success:function(b,c,a){a.status==200?(alert('upload save has succeeded'),console.log('upload save has succeeded')):(alert('upload save has failed'),console.log('upload save has failed'))},error:function(a,b,c){console.log('unable to reach server, upload save failed'),alert('unable to reach server, upload save failed')}}))}function refreshAccessToken(){$.ajax({url:serverloc+'/api/tokens/refresh',type:'POST',xhrFields:{withCredentials:!0},success:function(a,c,b){b.status==200?(accesstoken=a.slice(1,-2),tok_timerid&&clearInterval(tok_timerid),tok_timerid=setInterval(function(){refreshAccessToken()},240*1e3),initialLoad&&(initialParamRomandSave(),initialLoad=!1),enableLogoutRomSaveQuickServerMenuNodes()):(console.log('refresh token has failed'),accesstoken='')},error:function(a,b,c){a.readyState==0?navigator.onLine||(console.log('refresh request has failed..no connect..'),initialLoad&&(initialParamRomandSave(),initialLoad=!1),offlineEnableRomSaveServerMenuNodes(),accesstoken='offline_first_dummy'):console.log('refersh request has failed')}})}function loadRomList(){if(!checkAccessTok())return;$.ajax({url:serverloc+'/api/rom/list',type:'GET',headers:{Authorization:'Bearer '+accesstoken},success:function(a,c,b){b.status==200?($('#romlist > button').remove(),$(a).each(function(b,a){$('<button type="button" class="list-group-item list-group-item-action" data-bs-dismiss="modal">'+a+'</button>').click(function(){loadRomFromServer($(this).text())}).appendTo('#romlist')})):(console.log('list server roms has failed'),alert('list server roms has failed'))},error:function(a,b,c){console.log('unable to reach server, rom list failed'),alert('unable to reach server, rom list failed')}})}function loadSaveList(){if(!checkAccessTok())return;$.ajax({url:serverloc+'/api/save/list',type:'GET',headers:{Authorization:'Bearer '+accesstoken},success:function(a,c,b){b.status==200?($('#savelist > button').remove(),$(a).each(function(b,a){$('<button type="button" class="list-group-item list-group-item-action" data-bs-dismiss="modal">'+a+'</button>').click(function(){loadSaveFromServer($(this).text())}).appendTo('#savelist')})):(console.log('list server saves has failed'),alert('list server saves has failed'))},error:function(a,b,c){console.log('unable to reach server, save list failed'),alert('unable to reach server, save list failed')}})}