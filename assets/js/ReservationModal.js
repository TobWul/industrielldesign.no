var modal = Vue.component('modal', {
  props: ["visibility", "file"],
  data: function() {
    return {
      progressPercent: 0,
      filename: '',
      duration: -1,
      filament: -1,
      courseRelated: false,
      lines: '',
      hours: '',
      minutes: '',
      estimating: false,
    }      
  },
  created: function() {
    console.log('visibility: ' + this.visibility);
    console.log("created modal");
  },
  watch: {
    file: function() {
      this.listenToMessages();
      if (this.file) {
        const self = this;
        this.verifyFile(this.file, (success) => {
          if (success) {
            this.textLinesFromFile(this.file, (lines) => {
              self.lines = lines;
            });
          }
        });
      }
      else {
        this.hide();
      }
    },
    hours: function() {
      this.duration = this.calculateDuration();
    },
    minutes: function() {
      this.duration = this.calculateDuration();
    },
    modalVisibility: function() {
      if (this.modalVisibility==true) {
        if (this.file == '') {
          this.$refs.filename.focus();
        }
        else {
          this.$refs.hours.focus();
        }
      }
    }
  },
  methods: {
    proceedToPlacement: function() {
      /*
      METHOD 1
      1. get optimal placement time
      2. place uniquely colored segment in timeline at suggested time
      3. allow for dragging of this segment object
      4. signify that the process is not complete!!
      5. verify completion upon drag-finished || verify completion on clicking 'reserve' button!
      */

      this.recommendTimeSlot((result) => {
        const device = result.device;
        const startTime = result.startTime;
        const duration = result.duration;
        result.priority = "New";
        console.log('device: ' + device);
        console.log("startTime: " + startTime);
        console.log("duration: " + duration);

        this.$store.dispatch('addJobToStaging', result);

        //manage no result coming back or error below
      });
      
    },
    cancelEstimate: function() {
      this.estimating = false;
      gcodeProcessorWorker.terminate();
      gcodeProcessorWorker = undefined;
      // gcodeProcessorWorker.postMessage({
      //     message: 'cleanup',
      // });
    },
    estimatePrintTime: function() {
      //change to cancel estimation button
      this.estimating = true;
      const settings = {"maxSpeed":[100,100,10,100],"maxPrintAcceleration":[1000,1000,100,10000],"maxTravelAcceleration":[1000,1000,100,10000],"maxJerk":[10,10,1,10],"absoluteExtrusion":false,"feedrateMultiplyer":100,"filamentDiameter":1.75,"firmwareRetractLength":2,"firmwareUnretractLength":2,"firmwareRetractSpeed":50,"firmwareUnretractSpeed":50,"firmwareRetractZhop":0,"timeScale":1.01};
      const lines = this.lines;
      gcodeProcessorWorker.postMessage({
          message: 'processGcodes',
          data: [lines, settings]
      });
    },
    hide: function() {
      // this.$store.dispatch('hideModal');
      console.log("hide");
      this.$emit('hideModal');
      this.resetData();
    },
    resetData: function() { 
      this.hours = '';
      this.minutes = '';
      this.filename = '';
      this.proposal = {};
    },
    makeCourseRelated: function(checked) {
      this.courseRelated = checked;
    },
    verifyFile: function(file, success) {
      const filename = file.name;
      const filename_components = filename.split(".");
      if (filename_components.length == 2) { 
        const extension = filename_components[1];
        if (extension == "gcode") {
          this.filename = filename;
          success(true);
        }
      }
      success(false);
    },
    textLinesFromFile: function(file, complete) {
      var reader = new FileReader();
      reader.onload = function(){
        var lines = this.result.split(/\s*[\r\n]+\s*/g);
        complete(lines);
      };
      reader.readAsText(file);
    },
    listenToMessages: function() {
      var self = this;
      gcodeProcessorWorker.onmessage = function (e) {
      if ("progress" in e.data) {
        // self.progressPercent = e.data.progress;
        console.log("progress: " + e.data.progress);
      } else if ("complete" in e.data) {
        // document.getElementById("LoadingBar").style.display = "none";
        // self.progressPercent = 0;
      } else if ("result" in e.data) {
        const result = e.data.result;
        const duration = Math.floor(result.printTime);
        self.estimating = false;
        self.duration = duration
        self.filament = result.filamentUsage;

        self.convertToHrsMins(duration);
        // self.humanReadablePrintTime = self.secondsToHumanReadable(duration);

      } else if ("layers" in e.data) {
        gcodeProcessorWorker.postMessage("cleanup");
      }
    }
  },
  recommendTimeSlot: function(completion) {
    if (this.duration == -1) { return; } 
    const url='http://localhost:1337/reservation-proposal/'+this.duration;
    axios.get(url)
      .then(res => {
        completion(res.data);
        // console.log("job proposal: "+ res.data.device);
        // self.proposal = res.data;
      })
      .catch(err => {
        console.log("error " + err)
        completion(err);
      });
  },
  convertToHrsMins: function(duration) {
    console.log('convert to hrs mins')
    this.hours = Math.floor(duration / 3600);
    this.minutes = Math.floor((duration % 3600) / 60);
  
    // var hoursStr = "";
    // var minStr = "";
    // if (hrs > 0) {
    //   hoursStr = (hrs > 1 ? hrs+" hours" : hrs+" hour");
    // }
    // if (mins > 1) {
    //   minStr = ", " + mins + " minutes";
    // }
    // return hoursStr + minStr;
  },
  calculateDuration: function () {

      //IF both have text values, but only one is greater than zero, return -1

      const convertedHours = isNaN(this.hours) ? 0 : this.hours*3600;
      const convertedMinutes = isNaN(this.minutes) ? 0 : this.minutes*60;
      
      if ((this.hours.length > 0) && (this.minutes.length > 0)) {
        if (isNaN(this.hours) || isNaN(this.minutes)) {
          return -1;
        }
      }
      if ((convertedMinutes+convertedHours) == 0) {
        return -1; 
      }
      else {
        return convertedMinutes+convertedHours; 
      }
  }
},
template: 
 `<div class="ReservationModal Visible">
        <div class="ReservationModalContent">
          <div class="ModalTitle header3">New Reservation</div>

          <div class="FormContainer">

            <div class="ModalRow">
              <div class="ModalColumn subtitle1">Filename</div>
              <input class="ModalColumn modalInput" placeholder="filename / description" ref="filename" v-model="filename">
            </div>
            
            <div class="ModalRow">
              <div class="ModalColumn subtitle1">Print Time</div>
              <div class="ModalColumn">
                <div class="ModalRow">
                  <div class="ModalColumn">
                    <div v-if="estimating" class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
                    <input v-if="!estimating" class="modalInput timeInput" ref="hours" v-model="hours" placeholder="0">
                  </div>
                  <div class="ModalColumn timeTitle">
                    hours
                  </div>
                  <div class="ModalColumn">
                    <div v-if="estimating" class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
                    <input v-if="!estimating" class="modalInput timeInput" ref="minutes" v-model="minutes" placeholder="0">
                  </div>
                  <div class="ModalColumn timeTitle">
                    mins
                  </div>

                </div>
                <div class="ModalRow">
                  <button class="button small" :disabled="lines==='' || estimating" @click="estimatePrintTime"><span>Estimate Time</span></button>
                  <!-- <button v-if="estimating" class="button small" @click="cancelEstimate"><span>Cancel Estimate</span></button> -->
                </div>
              </div>
            </div>
            
            <div class="ModalRow">
              <div class="ModalColumn subtitle1">Course Related</div>
              <div class="ModalColumn">
                <input type="checkbox" class="checked" id="is_course_related" v-model="courseRelated">
              </div>
            </div>
            
            <div class="ModalRow">
              <button class="button fluid" :disabled="duration==-1" @click="proceedToPlacement"><span>Continue</span></button>
            </div>
            <div class="ModalRow lastFlexItem">
              <button class="button secondary fluid" @click="hide"><span>Cancel</span></button>
            </div>
            
          </div>

        </div>
      </div>`
});