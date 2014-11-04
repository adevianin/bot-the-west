
var tasks = [];
var currentTaskId = 0;
var audio;
window.onload = function() {
    gcFillJobDropdown();
	randomClick();
};

function addTaskButton() {
    var jobName = document.getElementById("job").selectedOptions[0].text;
    var jobId = document.getElementById("job").value;
    var motivation = parseInt(document.getElementById("motivation").value);
    if (typeof motivation != "number" || motivation < -1 || motivation > 100) {
        motivation = 50;
    }
    addTask(jobName, jobId, motivation, false);
}

function addTask(jobName, jobId, motivation, isAutoTask) {
    currentTaskId++;
    var tr = document.createElement("tr");
    tasks.push({jobId: jobId, motivation: motivation, taskId: currentTaskId, row: tr, isAutoTask: isAutoTask});

    tr.onmouseover = function() {
        this.style.background = "rgb(223, 223, 223)"
    };
    tr.onmouseout = function() {
        this.style.background = "rgb(255, 255, 255)"
    }

    var td1 = document.createElement("td");
    td1.innerText = jobName;
    var td2 = document.createElement("td");
    td2.innerText = motivation;
    td2.style.paddingLeft = "5px";
    td2.style.textAlign = "center";
    var td3 = document.createElement("td");
    td3.style.paddingLeft = "5px";
    td3.style.textAlign = "center";
    var p = document.createElement("p");
    p.innerText = "X";
    p.style.cursor = "pointer";
    p.style.margin = "0px";
    p.style.display = "inline";
    p.style.color = "red";
    p.style.fontWeight = "bold";
    td3.appendChild(p);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    document.getElementById("tasksList").children[0].insertBefore(tr, document.getElementById("elementsForAdding"));
    p.addEventListener("click", Function("delTask(" + currentTaskId + "); tmReset();"));
}


function delTask(taskId) {
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].taskId == taskId) {
            tasks[i].row.remove();
            tasks.splice(i, 1);
            break;
        }
    }
}

function delAutoTasks() {
    var ids = [];
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].isAutoTask)
            ids.push(tasks[i].taskId);
    }

    for (var i = 0; i < ids.length; i++) {
        delTask(ids[i]);
    }
}

/*game connector--------------------------------------------------------------*/
var gameDoc = window.opener.document;
var gameWin = window.opener;

function randomClick(){
	console.log("randomClick");
	setTimeout(randomClick, parseInt(Math.random()*170 + 10)*1000);
	gameDoc.getElementsByClassName("menulink lcharacter")[0].click();
}

function gcFillJobDropdown() {
    gameWin.JobsModel.initJobs();
    gameWin.JobsModel.sortJobs("name", null, "asc");
    for (var i = 0; i < gameWin.JobsModel.Jobs.length; i++) {
        if (gameWin.JobsModel.Jobs[i].isVisible) {
            var option = document.createElement("option");
            option.value = gameWin.JobsModel.Jobs[i].id;
            option.innerText = gameWin.JobsModel.Jobs[i].name;
            document.getElementById("job").appendChild(option);
        }
    }
}

function gcStartJob(id, duration) {
    gameWin.Ajax.get('map', 'get_minimap', {}, function(json) {
		if(json.error){console.error("трохи упав gcStartJob: "+json.msg); return;}
        var groups = json.job_groups[gameWin.JobList.getJobById(id).groupid];
        var x = groups[0][0];
        var y = groups[0][1];
        var minTime = gameWin.Map.calcWayTime(gameWin.Character.getPosition(), {x: x, y: y});
        for (var i = 0; i < groups.length; i++) {
            if (gameWin.Map.calcWayTime(gameWin.Character.getPosition(), {x: groups[i][0], y: groups[i][1]}) < minTime) {
                x = groups[i][0];
                y = groups[i][1];
                minTime = gameWin.Map.calcWayTime(gameWin.Character.getPosition(), {x: x, y: y});
            }
        }
        var tasks = new gameWin.Array();
        tasks.push(new gameWin.TaskJob(id, x, y, duration));
        gameWin.TaskQueue.add(tasks);
    }, null);
}

function gcGoSleep(townName, room) {
    if (townName == "")
        return;
    gameWin.Ajax.get('map', 'get_minimap', {}, function(json) {
		if(json.error){console.error("трохи упав gcGoSleep: "+json.msg); return;}
        for (var tid in json.towns) {
            if (json.towns[tid].name == townName) {
                gameWin.HotelWindow.townid = tid;
                gameWin.HotelWindow.start(room);
				break;
            }
        }
    }, null);
}

function gcPutMoneyToBank() {
    gameWin.Ajax.get('map', 'get_minimap', {}, function(json) {
		if(json.error){console.error("трохи упав 1 gcPutMoneyToBank: "+json.msg); return;}
        for (var tid in json.towns) {
            if (json.towns[tid].x == gameWin.Character.position.x && json.towns[tid].y == gameWin.Character.position.y) {
                gameWin.Ajax.remoteCall("building_bank", "deposit", {town_id: tid, amount: gameWin.Character.money}, function(data) {
                    if (data.error == false) {
                        gameWin.BankWindow.Balance.Mupdate(data);
                        gameWin.Character.setDeposit(data.deposit);
                        gameWin.Character.setMoney(data.own_money);
                    } else {
                        console.error("трохи упав 2 gcPutMoneyToBank: " + data.msg);
                    }
                }, null)
                break;
            }
        }
    }, null);
}

function gcCancelAllJobs() {
    var cancelButtons = gameDoc.getElementsByClassName("taskAbort");
    for (var i = 0; i < cancelButtons.length; i++) {
        cancelButtons[i].click();
    }
}
var refreshTimer = undefined;
function gcSetRefreshGameTimer(){
	if(document.getElementById("refreshGame").checked){
		if(!refreshTimer){
			refreshTimer = setInterval(function(){
				gameWin.location.reload();
				console.log("refresh");
			}, 3600*1000);
		}
	}else{
		clearInterval(refreshTimer);
		refreshTimer = undefined;
	}
}

/*function open(classes, callback) {
 var interval = setInterval(function() {
	 if (gameDoc.getElementsByClassName(classes[0]).length > 0) {
		 gameDoc.getElementsByClassName(classes[0])[0].click();
		 classes.shift();
		 if (classes.length == 0) {
			 clearInterval(callback.interval);
			 callback();
		 }
	 }
 }, 500);
 callback.interval = interval;
 }
 
 function closeAll() {
 gameDoc.getElementsByClassName("tw2gui_window_buttons_closeall")[0].click();
 }*/




/*task manager----------------------------------------------------------------*/
var currentTask = undefined;
var timerChekingEmploy = undefined;

function tmReset() {
    currentTask = undefined;
    //gcCancelAllJobs();
}

function tmStartWork() {
    if (timerChekingEmploy === undefined) {
        timerChekingEmploy = setInterval(function() {
			console.log("check");
            if (gameWin.TaskQueue.queue.length < 1) {
                if (currentTask) {
                    if (gameWin.Character.energy >= 2) {
                        gameWin.Ajax.remoteCallMode('work', 'index', {}, function(json) {
                            gameWin.JobsModel.initJobs(json.jobs);
                            if (gameWin.JobsModel.getById(currentTask.jobId).jobmotivation * 100 > currentTask.motivation || currentTask.motivation == -1) {
                                console.log("старт " + gameWin.JobsModel.getById(currentTask.jobId).name + " " + new Date().getHours() + ":" + new Date().getMinutes());
                                gcStartJob(currentTask.jobId, tmGetWorkTime());
                            } else {
                                delTask(currentTask.taskId);
								tmReset();
                            }
                        }, null);
                    } else {
                        var town = document.getElementById("town").value;
                        if (town != "") {
                            console.log("іду спать в " + town + ". " + new Date().getHours() + ":" + new Date().getMinutes());
                            gcGoSleep(town, document.getElementById("room").value);
                        }
                    }
                } else {
                    if (tasks.length > 0) {
                        currentTask = tasks[0];
                    } else {
                        if (document.getElementById("autoTask").checked) {
                            addAutoTasks(document.getElementById("direct").value);
                        } else {
                            clearInterval(timerChekingEmploy);
                            timerChekingEmploy = undefined;
                        }
                    }
                }
            } else {
                if (gameWin.TaskQueue.queue[0].type == "sleep") {
                    if (gameWin.Character.money > 1 && gameWin.TaskQueue.queue[0].data.x == gameWin.Character.position.x && gameWin.TaskQueue.queue[0].data.y == gameWin.Character.position.y) {
						console.log("кладу гроші в банк. " + new Date().getHours() + ":" + new Date().getMinutes());
                        gcPutMoneyToBank();
                    }

                    if (gameWin.Character.energy == gameWin.Character.maxEnergy) {
                        gcCancelAllJobs();
                    }
                }

            }
        }, 3000);
    }
}

function addAutoTasks(type) {
    gameWin.Ajax.remoteCallMode('work', 'index', {}, function(json) {
        gameWin.JobsModel.initJobs(json.jobs);
        gameWin.JobsModel.sortJobs(type, null, "desc");
        tasks = [];

        for (var i = 0; i < gameWin.JobsModel.Jobs.length; i++) {
            if (gameWin.JobsModel.Jobs[i].isVisible) {
                var motivation = parseInt(gameWin.JobsModel.Jobs[i].jobmotivation * 100 - 10);
                if (motivation < 0) {
                    motivation = 0;
                }
                addTask(gameWin.JobsModel.Jobs[i].name, gameWin.JobsModel.Jobs[i].id, motivation, true);
                break;
            }
        }

    }, null);
}

function tmGetWorkTime() {
    if (gameWin.Character.level >= 20 && gameWin.Character.energy >= 12) {
        return 3600;
    }
    if (gameWin.Character.level >= 10 && gameWin.Character.level < 20 && gameWin.Character.energy >= 4) {
        return 600;
    }
    if (gameWin.Character.energy >= 2) {
        return 15;
    }
    return 0;
}
