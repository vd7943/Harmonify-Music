let currentSong = new Audio();
let songs;
let currentIndex = 0;
let currFolder;

// by use of chatgpt
function convertToMinutesAndSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  // Calculate minutes and seconds
  const minutes = Math.floor(seconds / 60);
  const remSeconds = Math.floor(seconds % 60);

  // Pad minutes and seconds with leading zeros if necessary
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(remSeconds).padStart(2, "0");

  // Return the formatted time
  return `${paddedMinutes}:${paddedSeconds}`;
}

const getSongs = async (folder) => {
  currFolder = folder;
  let response = await fetch(
    `http://127.0.0.1:5500/Harmonify%20music%20app/${folder}/`
  );
  let data = await response.text();

  let div = document.createElement("div");
  div.innerHTML = data;

  let as = div.getElementsByTagName("a");
  songs = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split(`/${folder}/`)[1]);
    }
  }

  // show all the song in playlist in your library
  let songUL = document
    .querySelector(".songList")
    .getElementsByTagName("ul")[0];
  songUL.innerHTML = "";
  for (const song of songs) {
    songUL.innerHTML += `<li> <img src="assets/music.svg" alt="" class="invert">
                               <div class="info">
                                   <div> ${song
                                     .replaceAll("%20", " ")
                                     .replace(".mp3", " ")}</div>
                               </div>
                               <div class="playnow">
                                   <span>Play Now</span>
                                   <img src="assets/play.svg" alt="" class="invert">
                               </div>
                           </li>`;
  }
  // attach an eventlistner to each song
  Array.from(
    document.querySelector(".songList").getElementsByTagName("li")
  ).forEach((e) => {
    e.addEventListener("click", () => {
      playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
    });
  });
  return songs;
};

const playMusic = (track, pause = false) => {
  currentSong.src = `http://127.0.0.1:5500/Harmonify%20music%20app/${currFolder}/${track}.mp3`;
  if (!pause) {
    currentSong.play();
    play.src = "assets/pause.svg";
  }
  document.querySelector(".song-info").innerHTML = `🎶 ${decodeURI(
    track
  ).replace(".mp3", "")}`;
  document.querySelector(".song-time").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
  let response = await fetch(
    `http://127.0.0.1:5500/Harmonify%20music%20app/songs/`
  );
  let data = await response.text();

  let div = document.createElement("div");
  div.innerHTML = data;
  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".card-container");
  let array = Array.from(anchors);
  for (let index = 0; index < array.length; index++) {
    const e = array[index];

    if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
      let folder = e.href.split("/").slice(-1)[0];
      // Get the metadata of the folder
      let response = await fetch(
        `http://127.0.0.1:5500/Harmonify%20music%20app/songs/${folder}/info.json`
      );
      let data = await response.json();
      cardContainer.innerHTML =
        cardContainer.innerHTML +
        `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <i class="fa-solid fa-play"></i>
                        </div>
                        <img class="rounded" src="songs/${folder}/cover.jpeg" alt="">
                        <h3>${data.title}</h3>
                        <p>${data.description}</p>
                    </div>`;
    }
  }

  // load the harmonify playlist whenever the card is clicked
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
      playMusic(songs[0]);
    });
  });
}

const main = async () => {
  // get the list of all the songs href
  await getSongs("songs/ncs");
  playMusic(songs[0], true);

  //Display all the albums on the page
  displayAlbums();

  // Attach an eventlistner to play,next and previous
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "assets/pause.svg";
    } else {
      currentSong.pause();
      play.src = "assets/play.svg";
    }
  });

  // listen for time update event
  currentSong.addEventListener("timeupdate", () => {
    // console.log(currentSong.currentTime, currentSong.duration);
    document.querySelector(
      ".song-time"
    ).innerHTML = `${convertToMinutesAndSeconds(
      currentSong.currentTime
    )} / ${convertToMinutesAndSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // add an eventlistner to seekbar and also using chatgpt
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = e.offsetX / e.target.getBoundingClientRect().width;
    document.querySelector(".circle").style.left = percent * 100 + "%";
    if (isFinite(currentSong.duration)) {
      currentSong.currentTime = currentSong.duration * percent;
    }
  });

  // add an event listner for hamburger
  document.querySelector(".nav .hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  // add an event listner for close
  document.querySelector(".left .close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // add an event listner to previous and next
  document.getElementById("previous").addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
    } else {
      currentIndex = songs.length - 1; // Wrap around to the last song
    }
    playMusic(songs[currentIndex].replace(".mp3", ""));
  });

  document.getElementById("next").addEventListener("click", () => {
    if (currentIndex < songs.length - 1) {
      currentIndex++;
    } else {
      currentIndex = 0; // Wrap around to the first song
    }
    playMusic(songs[currentIndex].replace(".mp3", ""));
  });

  // volume bar
  document
    .getElementById("range")
    .getElementsByTagName("input")[0]
    .addEventListener("change", (e) => {
      currentSong.volume = parseInt(e.target.value) / 100;
    });

  // add event listner to mute the track
  document.querySelector(".volume>img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document
        .getElementById("range")
        .getElementsByTagName("input")[0].value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;
      document
        .getElementById("range")
        .getElementsByTagName("input")[0].value = 25;
    }
  });
};

main();
