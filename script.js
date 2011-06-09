//
// good/bad
//
// good/bad - the timemanagement webapp. It works exactly 
// like a chess clock and you try to find strategies to minimize 
// your procastination with it.
//
// Created by @daniel_oberg
//



// Set and retrive js objects in storage. Requires HTML5.
//
// Examples
// 
//   localStorage.setObject("colors", ['green', 'yellow']);
//   > undefined
//
//   localStorage.getObject("colors")
//   > ["green", "yellow"]
//
Storage.prototype.setObject = function(key, data) {
  this.setItem(key, JSON.stringify(data));
}

Storage.prototype.getObject = function(key) {
  return this.getItem(key) && JSON.parse(this.getItem(key));
}

// Retrives an object from local storage (HTML5) or
// of the object is not found then return the 
// provided default value.
//
// name          - name of your choosing
// default_value - value to set if name is not found in storage
// 
// Examples
//
//   get_or("colors", ['black'])
//   > ['green', 'yellow']
//
//   get_or("colours", ['black'])
//   > ['black']
//
function get_or(name, default_value) {
  value = localStorage.getObject(name);
  if (value !== undefined) {
    return value;
  } else {
    return default_value;
  }
}

// Global variables

// Time spent in milliseconds
var good_time = get_or("good_time", 0);
var bad_time = get_or("bad_time", 0);

// Time wished to be reached in milliseconds
var good_time_goal = get_or("good_time_goal", 0);
var bad_time_goal = get_or("bad_time_goal", 0);

var paused = get_or("paused", true);

// Switch between good and bad time. If true then good.
var good = get_or("good", true);

var has_won = get_or("has_won", false);
var is_over = get_or("is_over", false);

// List of times for the linear graph.
// Has the format [[time string, good_time - bad_time], ...]
// 
// Examples
//
//   [["12:14", 83009], ["12:20", 99000]]
//
var list_of_times = get_or("list_of_times", []);

// Time of last update of good_time and bad_time.
// In milliseconds since 1970.
var time_backup = get_or("time_backup", new Date().getTime());


$(document).ready(function () {

  // Save all global variables in localStorage
  // in case the user moves away from the page.
  function save_state() {
    localStorage.setObject("good_time", good_time);
    localStorage.setObject("bad_time", bad_time);

    localStorage.setObject("good_time_goal", good_time_goal);
    localStorage.setObject("bad_time_goal", bad_time_goal);

    localStorage.setObject("paused", paused);
    localStorage.setObject("good", good);

    localStorage.setObject("has_won", has_won);
    localStorage.setObject("is_over", is_over);

    localStorage.setObject("list_of_times", list_of_times);

    localStorage.setObject("time_backup", time_backup);
  }

  // Save the state when the user moves away from the page.
  $(window).unload( function () { save_state(); } );

  // Smooth scrolling to a element
  //
  // anchor - jQuery selector to scroll to
  //
  // Examples
  //
  //   scroll_to('#muppet')
  //   > undefined
  //
  function scroll_to(anchor) {
    var target_offset = $(anchor).offset();
    var target_top = target_offset.top;

    $('html, body').animate({
      scrollTop: target_top
    }, 500);
  }

  // Add the current time and the difference
  // in good time and bad time in minutes to
  // the linear graph.
  function push_time() {
    current = new Date();
    var hour = current.getHours();
    var min = current.getMinutes();

    var hour_str = (hour<=9)? "0" + hour : hour;
    var min_str = (min<=9)? "0" + min : min;

    list_of_times.push([hour_str+ ":" + min_str,
                       Math.floor((good_time - bad_time) / 60000)]);
  }

  // Start counting good and bad time
  function start_countdown() {
    push_time();  // Add start-time to graph

    time_backup = new Date().getTime();

    paused = false;
  }

  // User clicked on the good or bad time clock
  // to switch between modes.
  function set_good(is_good) {
    // Check if user has a goal
    if (good_time_goal === 0 || bad_time_goal === 0) {
      scroll_to("#settings");
      return false;
    }
    // Check if we should switch mode also
    // if the clock is paused it needs to start.
    if (good !== is_good || paused === true) {
      good = is_good;
      start_countdown();
    }

    return false;  // Don't reload the page
  }

  // User has clicked on the Go! button so
  // set the new goal time and all necessary state 
  // to start a new countdown. Starts in paused state to let
  // the user choose start mode (good or bad).
  function set_goal() {
    if ($('#good_hours_goal').val() * 1 === 0 || $('#bad_hours_goal').val() * 1 === 0) {
      scroll_to("#settings");
      return false;
    }

    paused = true;
    good = true;
    has_won = false;
    is_over = false;

    list_of_times = [];

    $("#good_headline").show();
    $("#bad_headline").show();

    good_time_goal = $('#good_hours_goal').val() * 3600000;
    bad_time_goal = $('#bad_hours_goal').val() * 3600000;

    good_time = 0;
    bad_time = 0;


    set_display();

    scroll_to("#good");
    return false;  // Don't reload the page.
  }

  // Present the user with both the good and bad countdown
  // TODO: refactor
  function set_display() {
    good = !good;
    display();
    good = !good;
    display();
  }

  // Update the countdown time for whatever mode (good/bad)
  // we are in.
  function display() {
    var timeleft = 0;
    if (good === true) {
      timeLeft = Math.floor((good_time_goal - good_time)/1000);
    } else {
      timeLeft = Math.floor((bad_time_goal - bad_time)/1000);
    }

    // Calc number of days, hours, minutes and seconds left
    var days = Math.floor(timeLeft / 86400);
    var hours = Math.floor((timeLeft - (days * 86400)) / 3600);
    var minutes = Math.floor((timeLeft - (days * 86400) - (hours * 3600)) / 60);
    var seconds = Math.floor((timeLeft - (days * 86400) - (hours * 3600) - (minutes * 60)));

    // Add leading zero if necessary and change type
    if (hours < 10) {
      hours = "0" + hours;
    }
    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    if (seconds < 10) {
      seconds = "0" + seconds;
    }

    // The string to show
    var result = hours + ":" + minutes + ":" + seconds;

    // if we haven't won or lost that is
    if (timeLeft <= 0) {
      if (good === true) {  // Won
        result = "Good work!";
        has_won = true;
        $("#good_headline").hide();

      } else if (has_won === false) {  // Lost
        $("#bad_headline").hide();
        result = "Fail!";

      } else {  // Won and then used up his bad time
        $("#bad_headline").hide();
        result = "More work?";
      }

      if (is_over === false) {  // Only draw chart once
        var snd = new Audio("sound.wav");
        snd.play();
        $('#patterns').show();
        push_time();
        drawChart();
      }
      is_over = true;
    }

    // Choose which countdown to set
    if (good === true) {
      $("#good time").html(result);
    } else {
      $("#bad time").html(result);
    }
  }

  // Function gets called (very) roughly every second
  function timer() {
    if (paused === true) {
      return;
    }

    time_new = new Date().getTime();
    // Amount of time passed in milliseconds
    // since good_time and bad_time was updated
    var time_diff = time_new - time_backup;

    // Add milliseconds to either good or bad time
    if (good === true) {
      good_time += time_diff;
    } else {
      bad_time += time_diff;
    }

    // Set time last updated
    time_backup = time_new;

    // Present the new countdown values
    display();
  }

  // If goal is set, e.g. the user moved away from the
  // page and came back then present the countdown values.
  if (good_time_goal) {
    set_display();
  }

  // Set the timer to update the countdown values every second.
  setInterval(function () {
    timer();
  }, 1000);


  // Set events
  $("#good").click(function () {
    set_good(true);
  });
  $("#bad").click(function () {
    set_good(false);
  });
  $("#go_btn").click(function () {
    set_goal();
  });

  // If the user is in the textbox for setting
  // amount of hours for a goal and pushes enter
  // then commit those changes.
  $('.enter_listener').keyup(function (e) {
    if (e.keyCode === 13) {
      set_goal();
    }
  });

  // Smoothly scroll from all anchor links
  $('a[href*="#"]').click(function (event) {
    event.preventDefault();

    var full_url = this.href;

    var parts = full_url.split("#");
    var target_id = parts[1];

    scroll_to("#" + target_id);
  });

});


// Google Visualization API

google.load("visualization", "1", {
  packages: ["corechart"]
});

// Create both a line chart and a pie chart.
function drawChart() {
  // Create a line chart with the difference
  // between amount of good and bad time spent.
  var data = new google.visualization.DataTable();

  data.addColumn('string', 'Time');
  data.addColumn('number', 'Work - non-work (minutes)');

  // Populate data with values from list_of_times
  for (var i = 0; i < list_of_times.length; i++) {
    data.addRow(list_of_times[i]);
  }

  // Create and draw the visualization.
  var chart = new google.visualization.LineChart(document.getElementById('line_chart'));
  chart.draw(data, {
    curveType: 'function',
    legend: 'none',
    width: 400,
    height: 240,
    backgroundColor: '#E8E8E8',
    colors: ['red', 'black'],
    hAxis: { textPosition: 'none' }
  });


  // Create a pie chart representing the amount
  // of good vs bad time spent (in minutes).
  data = new google.visualization.DataTable();
  data.addColumn('string', 'Task');
  data.addColumn('number', 'Minutes');
  data.addRows(5);
  data.setValue(0, 0, 'Good');
  data.setValue(0, 1, Math.floor(good_time/60000));
  data.setValue(1, 0, 'Bad');
  data.setValue(1, 1, Math.floor(bad_time/60000));

  // Create and draw the visualization.
  new google.visualization.PieChart(document.getElementById('pie_chart')).
    draw(data, {
    colors: ['red', 'black'],
    width: 400,
    height: 240,
    backgroundColor: '#E8E8E8',
    is3D: true
  });

}
