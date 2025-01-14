import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Drawer from "@material-ui/core/Drawer";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import Typography from "@material-ui/core/Typography";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import Slider from "@material-ui/core/Slider";
import Switch from "@material-ui/core/Switch";
import "./App.css";

const swapTime = 0;
const initColumnNbr = 100;
const highlightColor = "#FFFFFF"

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

const timeScale = (x) => Math.round(2 ** x) - 1;

const sleep = (ms) => {
  if (ms === 0) return new Promise((resolve) => setImmediate(resolve));

  return new Promise((resolve) => setTimeout(resolve, ms));
};

function hsvToRgbHex(h, s, v) {
  let f = (n, k = (n + h / 60) % 6) =>
    Math.round((v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)) * 255);

  return (
    "#" +
    [f(5), f(3), f(1)]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

const createArr = (columnNbr) => [...Array(columnNbr).keys()].map((a, idx) => { return {x: a, id: idx} })

class App extends React.Component {
  constructor(props) {
    super();

    this.arr = createArr(initColumnNbr);
    shuffleArray(this.arr);
    this.state = {
      isSorting: false,
      areSettingsOpen: false,
      chosenSortAlg: "Insertion Sort",
      columnNbr: initColumnNbr,
      swapTime: swapTime,
      isDrawing: false,
      canDraw: false,
    };
    this.sortingAlgorithms = {
      "Insertion Sort": this.insertionSort,
      "Selection Sort": this.selectionSort,
      "Cocktail Shaker Sort": this.cocktailShakerSort,
      "Bubble Sort": this.bubbleSort,
      "Radix Sort (LSD)": this.lsdRadixSort,
      "Radix Sort (MSD)": this.msdRadixSort,
      "Quick Sort": this.quickSort,
      "Comb Sort": this.combSort,
      "Shell Sort": this.shellSort,
      "Bully Sort": this.bullySort,
      // "Bully Sort 2": this.bullySort2,
    };
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    const canvas = this.canvasRef.current;
    const context = canvas.getContext("2d");
    var parent = document.getElementById("canvas-wrapper");

    context.canvas.width = parent.offsetWidth;
    context.canvas.height = parent.offsetHeight;

    this.drawAll(context, this.arr);
  }

  removeHighlight = (arr) => {
    this.highlight(arr, [])
  }

  highlight = (arr, indices) => {
    if (!this.state.isSorting) throw Error("isSorting is false!");

    const canvas = this.canvasRef.current;
    const context = canvas.getContext("2d");

    if (this.prevHighlightIndices) {
      for (let idx of this.prevHighlightIndices) {
        this.drawDiff(arr, idx, idx)
      }
    }
    this.prevHighlightIndices = indices

    for (let idx of indices) {
      this.clearColumn(context, idx);
      this.drawColumn(context, arr, idx, idx, highlightColor)
    }
  }

  drawDiff = (arr, i1, i2) => {
    if (!this.state.isSorting) throw Error("isSorting is false!");

    const canvas = this.canvasRef.current;
    const context = canvas.getContext("2d");
    this.clearColumn(context, i1);
    this.drawColumn(context, arr, i1, i2);
  };

  drawAll = (ctx, arr) => {
    for (let i = 0; i < arr.length; i++) {
      this.drawColumn(ctx, arr, i, i);
    }
  };

  clearAll = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  drawColumn = (ctx, arr, i1, i2, color) => {
    const arrLength = arr.length;
    const width = ctx.canvas.width / this.state.columnNbr;
    const height = (ctx.canvas.height / this.state.columnNbr) * (arr[i2].x + 1);
    const startX = width * i1;

    ctx.fillStyle = color || hsvToRgbHex((360 * arr[i2].x) / arrLength, 1, 1);
    this.fillRect(ctx, startX, 0, width, height);
  };

  fillRect = (ctx, startX, startY, width, height) => {
    const ctxHeight = ctx.canvas.height;
    ctx.fillRect(
      startX,
      Math.floor(ctxHeight) - Math.floor(startY) - Math.floor(height),
      Math.floor(width),
      Math.floor(height)
    );
  };

  clearColumn = (ctx, idx) => {
    const width = ctx.canvas.width / this.state.columnNbr;
    const startX = width * idx;

    this.clearRect(ctx, startX, width);
  };

  clearRect = (ctx, startX, width) => {
    const ctxHeight = ctx.canvas.height;
    ctx.clearRect(startX - 1, 0, Math.floor(width) + 2, Math.floor(ctxHeight));
  };

  sort = async (arr) => {
    if (this.state.isSorting) return;

    this.setState({ isSorting: true }, async () => {
      try {
        await this.sortingAlgorithms[this.state.chosenSortAlg](arr);
      } catch (e) {
        console.log("Sorting interrupted! Reason: " + e);
      }
      this.stopSorting()
    });
  };

  bubbleSort = async (arr) => {
    var isSorted = false;
    var sortedCount = 0
    while (!isSorted) {
      isSorted = true;
      for (let i = 1; i < arr.length-sortedCount; i++) {
        if (arr[i - 1].x > arr[i].x) {
          this.drawAndSwap(arr, i - 1, i);
          isSorted = false;
        }
        this.highlight(arr, [i-1, i]);
        await sleep(this.state.swapTime);
      }
      
      sortedCount++
    }
  };

  combSort = async (arr) => {
    var gap = this.state.columnNbr
    const shrinkFactor = 1.3 
    var isSorted = false
    while (!isSorted) {
      gap = Math.floor(gap/shrinkFactor)
      if (gap <= 1) {
        gap = 1
        isSorted = true
      }
      for (let i = gap; i < arr.length; i++) {
        if (arr[i - gap].x > arr[i].x) {
          this.drawAndSwap(arr, i - gap, i);
          isSorted = false;
        }
        this.highlight(arr, [i - gap, i]);
        await sleep(this.state.swapTime);
        
      }
    }
  };

  insertionSort = async (arr) => {
    for (let i = 1; i < arr.length; i++) {
      var j = i
      while (j > 0 && arr[j - 1].x > arr[j].x) {
        this.drawAndSwap(arr, j-1, j);
        this.highlight(arr, [j - 1, j]);
        await sleep(this.state.swapTime);
        j--;
      }
    }
  };

  lsdRadixSort = async (arr, base = 4) => {
    const buckets = Array(base);
    const indexMap = new Map()
    var shift = 0;
    var isSorted = false;
    while (!isSorted) {
      for (let i = 0; i < base; i++) {
        buckets[i] = [];
      }
      for (let i = 0; i < arr.length; i++) {
        const index = (Math.floor(arr[i].x / base ** shift)) % base;
        buckets[index].push(arr[i]);
        indexMap[arr[i].id] = i
      }
      shift++;
      var currentIndex = 0;

      if (buckets[0].length === arr.length) {
        break
      }

      for (let bucket of buckets) {
        for (let a of bucket) {
          const swapIndex = indexMap[a.id]
          this.drawAndSwap(arr, currentIndex, swapIndex);
          this.highlight(arr, [currentIndex, swapIndex])
          await sleep(this.state.swapTime);

          indexMap[arr[swapIndex].id] = indexMap[arr[currentIndex].id]
          currentIndex++;
        }
      }
    }
  };

  msdRadixSort = async (
    arr, 
    base = 4,
    start = 0,
    end = this.state.columnNbr,
    shift = Math.floor(Math.log(this.state.columnNbr)/Math.log(base))
  ) => {
    const buckets = Array(base);
    const indexMap = new Map()

    if (end-start === 0) return

    for (let i = 0; i < base; i++) {
      buckets[i] = [];
    }
    for (let i = start; i < end; i++) {
      const index = (Math.floor(arr[i].x / base ** shift)) % base;
      buckets[index].push(arr[i]);
      indexMap[arr[i].id] = i
    }

    const bucketIndices = []

    var currentIndex = start;

    for (let bucket of buckets) {
      const bucketStart = currentIndex
      for (let a of bucket) {
        const swapIndex = indexMap[a.id]
        this.drawAndSwap(arr, currentIndex, swapIndex);
        this.highlight(arr, [currentIndex, swapIndex])
        await sleep(this.state.swapTime);

        indexMap[arr[swapIndex].id] = indexMap[arr[currentIndex].id]
        currentIndex++;
      }
      if (shift === 0) continue

      bucketIndices.push([bucketStart, currentIndex])
    }
    for (const [bucketStart, bucketEnd] of bucketIndices) {
      await this.msdRadixSort(arr, base, bucketStart, bucketEnd, shift-1)
    }
  };

  selectionSort = async (arr) => {
    for (let i = 0; i < arr.length; i++) {
      var curJ = i;
      for (let j = i + 1; j < arr.length; j++) {
        this.highlight(arr, [curJ, j])
        await sleep(this.state.swapTime);
        if (arr[j].x < arr[curJ].x) {
          curJ = j;
        }
      }
      if (curJ !== i) {
        this.drawAndSwap(arr, curJ, i);
        await sleep(this.state.swapTime);
      }
    }
  };

  cocktailShakerSort = async (arr) => {
    var isSorted = false;
    var shouldSortReversed = false;
    var sortedCountRight = 0
    var sortedCountLeft = 0
    while (!isSorted) {
      isSorted = true;
      if (!shouldSortReversed) {
        for (let i = 1+sortedCountLeft; i < arr.length-sortedCountRight; i++) {
          if (arr[i - 1].x > arr[i].x) {
            this.drawAndSwap(arr, i - 1, i);
            isSorted = false;
          }
          this.highlight(arr, [i - 1, i])
          await sleep(this.state.swapTime);
        }
        sortedCountRight++
      } else {
        for (let i = arr.length - 1 - sortedCountRight; i > sortedCountLeft; i--) {
          if (arr[i - 1].x > arr[i].x) {
            this.drawAndSwap(arr, i - 1, i);
            isSorted = false;
          }
          this.highlight(arr, [i - 1, i])
          await sleep(this.state.swapTime);  
        }
        sortedCountLeft++
      }
      shouldSortReversed = !shouldSortReversed;
    }
  };

  // Elmayo's brain child
  bullySort = async (arr) => {
    var isSorted = false;
    while (!isSorted) {
      isSorted = true;
      let swapIndex = 0;
      for (let i = 1; i < arr.length; i++) {
        if (arr[i - 1].x > arr[i].x && (arr[i+1]?.x ?? Infinity) >= arr[i].x) {
          for (let j = swapIndex; j < i; j++) {
            if (!(arr[i - 1].x > arr[j].x && (arr[i+1]?.x ?? Infinity) >= arr[j].x)) {
              this.drawAndSwap(arr, j, i);
              this.highlight(arr, [j, i])
              await sleep(this.state.swapTime);  
              isSorted = false;
              swapIndex++;
              break;
            }
          }
        }
      }
    } 
  }
  
  /* Not quite there yet
  bullySort2 = async (arr) => {
    var isSorted = false;
    while (!isSorted) {
      isSorted = true;
      let swapIndex = 0;
      const test = async (arr, i) => { 
        if (arr[i - 1].x > arr[i].x && (arr[i+1]?.x ?? Infinity) > arr[i].x) {
          if (!((arr[i - 1]?.x ?? -Infinity) > arr[swapIndex].x && (arr[i+1]?.x ?? Infinity) > arr[swapIndex].x)) {
            isSorted = false;
            this.drawAndSwap(arr, swapIndex, i);
            this.highlight(arr, [swapIndex, i])
            await sleep(this.state.swapTime);
            if (swapIndex > 0) {
              const temp = swapIndex;
              swapIndex = 0;
              await test(arr, temp);
            }
          } else {
            swapIndex++;
            await test(arr, i);
          }
        }
      }
      for (let i = 1; i < arr.length; i++) {
        await test(arr, i);
      }
    }
  }
  */

  //#region merge sort
  /* In-place merge sort is complicated...
  mergeSort = async (arr, start, end) => {
    if (start >= end) return
    if (end-start === 1) {
      if (arr[start] > arr[end]) {
        this.drawAndSwap(arr, start, end);
        await sleep(this.state.swapTime);
      }
    }

    const mid = Math.floor((start+end) / 2)
    this.mergeSort(arr, start, mid)
    this.mergeSort(arr, mid+1, end)
    var i = start
    var j = mid+1
    while (i < mid && j < end) {
      if (arr[i] > arr[j]) {
        this.drawAndSwap(arr, i, j);
        await sleep(this.state.swapTime);
      }
    }
  }
  */
 //#endregion

  quickSort = async (arr, start = 0, end = this.state.columnNbr-1) => {
    if (start >= end) return

    const mid = Math.floor((start+end)/2)

    if (arr[mid].x < arr[start].x) {
      this.drawAndSwap(arr, start, mid)
      this.highlight(arr, [start, mid])
      await sleep(this.state.swapTime)  
    }
    if (arr[end].x < arr[start].x) {
      this.drawAndSwap(arr, start, end)
      this.highlight(arr, [start, end])
      await sleep(this.state.swapTime)  
    }
    if (arr[mid].x < arr[end].x) {
      this.drawAndSwap(arr, mid, end)
      this.highlight(arr, [mid, end])
      await sleep(this.state.swapTime)  
    }

    const pivot = arr[end].x
    var i = start
    for (var j = start; j < end; j++) {
      if (arr[j].x < pivot) {
        this.drawAndSwap(arr, i, j)
        this.highlight(arr, [i, j])
        await sleep(this.state.swapTime)
        i++
      }
    }
    this.drawAndSwap(arr, i, end)
    this.highlight(arr, [i, end])
    await sleep(this.state.swapTime)

    await this.quickSort(arr, start, i-1)
    await this.quickSort(arr, i+1, end)
  }

  shellSort = async (arr) => {
    const gaps = [701, 301, 132, 57, 23, 10, 4, 1] // from https://oeis.org/A102549
    for (let gap of gaps) {
      if (gap > this.state.columnNbr) continue
      for (let i = gap; i < this.state.columnNbr; i++) {
        for (let j = i; j >= gap; j -= gap) {
          if (arr[j - gap].x > arr[j].x) {
            this.drawAndSwap(arr, j - gap, j);
          }
          else break

          this.highlight(arr, [j-gap, j])
          await sleep(this.state.swapTime);
        }
      }
    }
  }

  stopSorting = () => {
    if (this.prevHighlightIndices) {
      this.removeHighlight(this.arr)
    }
    this.setState({ isSorting: false });
    this.prevHighlightIndices = null
  };

  drawAndSwap = (arr, i1, i2) => {
    this.drawDiff(arr, i1, i2);
    this.drawDiff(arr, i2, i1);
    this.swap(arr, i1, i2);
  };

  swap = (arr, i1, i2) => {
    [arr[i1], arr[i2]] = [arr[i2], arr[i1]];
  };

  toggleDisplaySettings = () => {
    this.setState({ areSettingsOpen: !this.state.areSettingsOpen });
  };

  closeDisplaySettings = () => {
    this.setState({ areSettingsOpen: false });
  };

  chooseSortAlg = (event) => {
    this.stopSorting();

    this.setState({ chosenSortAlg: event.target.value });
  };

  changeColumnNbr = (event, value) => {
    this.stopSorting();

    this.arr = createArr(value);
    this.setState({ columnNbr: value }, () => this.shuffleAndDraw());
  };

  changeSwapTime = (event, value) => {
    this.setState({ swapTime: value });
  };

  resetAndDraw = () => {
    this.arr = createArr(this.state.columnNbr);
    this.shuffleAndDraw();
  };

  shuffleAndDraw = () => {
    this.stopSorting();

    shuffleArray(this.arr);

    const canvas = this.canvasRef.current;
    const context = canvas.getContext("2d");

    this.clearAll(context);
    this.drawAll(context, this.arr);
  };

  drawOnCanvas = (event) => {
    if (!this.state.isDrawing) return;

    const canvas = this.canvasRef.current;
    const context = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const index = Math.floor(
      ((event.clientX - rect.left) / canvas.width) * this.state.columnNbr
    );
    const height = Math.floor(
      ((canvas.height - (event.clientY - rect.top)) / canvas.height) *
        this.state.columnNbr
    );

    if (this.prevDrawIndex && this.prevDrawHeight) {
      const indexIncr = Math.sign(index - this.prevDrawIndex);
      let curHeight = this.prevDrawHeight;
      for (
        let i = this.prevDrawIndex + indexIncr;
        i !== index;
        i += indexIncr
      ) {
        curHeight +=
          (height - this.prevDrawHeight) / Math.abs(index - this.prevDrawIndex);
        this.arr[i].x = Math.round(curHeight);
        this.clearColumn(context, i);
        this.drawColumn(context, this.arr, i, i);
      }
    }

    this.arr[index].x = height;
    this.clearColumn(context, index);
    this.drawColumn(context, this.arr, index, index);
    this.prevDrawIndex = index;
    this.prevDrawHeight = height;
  };

  startDrawOnCanvas = () => {
    if (!this.state.canDraw) return;

    this.stopSorting();
    this.setState({ isDrawing: true });
  };

  endDrawOnCanvas = () => {
    this.prevDrawIndex = null;
    this.prevDrawHeight = null;
    this.setState({ isDrawing: false });
  };

  toggleCanDraw = () => {
    this.setState({ canDraw: !this.state.canDraw });
  };

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <AppBar position="relative">
            <Toolbar className="toolbar">
              <div>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => this.sort(this.arr)}
                  disableElevation
                >
                  Sort
                </Button>
              </div>
              <div>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={this.shuffleAndDraw}
                  disableElevation
                >
                  Shuffle
                </Button>
              </div>
              <div>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={this.resetAndDraw}
                  disableElevation
                >
                  Reset
                </Button>
              </div>
              <div>
                <FormControlLabel
                  control={
                    <Switch
                      checked={this.state.canDraw}
                      onChange={this.toggleCanDraw}
                      name="canDraw"
                    />
                  }
                  label="Draw Mode"
                />
              </div>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="end"
                className="open-drawer-button"
                onClick={this.toggleDisplaySettings}
              >
                <MenuIcon />
              </IconButton>
            </Toolbar>
          </AppBar>

          <div
            className="canvas-wrapper"
            id="canvas-wrapper"
            onClick={this.closeDisplaySettings}
          >
            <canvas
              className="App-canvas"
              ref={this.canvasRef}
              onMouseDown={this.startDrawOnCanvas}
              onMouseMove={this.drawOnCanvas}
              onMouseUp={this.endDrawOnCanvas}
              onMouseLeave={this.endDrawOnCanvas}
            />
          </div>

          <Drawer
            variant="persistent"
            anchor="right"
            className="drawer"
            open={this.state.areSettingsOpen}
          >
            <div className="chevron-wrapper">
              <IconButton onClick={this.toggleDisplaySettings}>
                <ChevronRightIcon />
              </IconButton>
            </div>
            <div className="sortAlgChoice-wrapper">
              <FormControl component="fieldset">
                <Typography
                  align="left"
                  variant="h6"
                  color="textSecondary"
                  gutterBottom
                >
                  Sorting Algorithm
                </Typography>
                <RadioGroup
                  className="choiceGroup"
                  aria-label="choiceGroup"
                  name="choiceGroup"
                  value={this.state.chosenSortAlg}
                  onChange={this.chooseSortAlg}
                >
                  {Object.keys(this.sortingAlgorithms).map((v) => (
                    <FormControlLabel
                      className="choice"
                      value={v}
                      key={v}
                      control={<Radio />}
                      label={v}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </div>
            <div>
              <Typography
                align="left"
                variant="h6"
                color="textSecondary"
                gutterBottom
              >
                # Columns
              </Typography>
              <div className="col-slider">
                <Slider
                  defaultValue={initColumnNbr}
                  aria-labelledby="discrete-slider"
                  valueLabelDisplay="auto"
                  min={10}
                  max={1000}
                  onChangeCommitted={this.changeColumnNbr}
                />
              </div>
            </div>
            <div>
              <Typography
                align="left"
                variant="h6"
                color="textSecondary"
                gutterBottom
              >
                Time per swap (ms)
              </Typography>
              <div className="col-slider">
                <Slider
                  defaultValue={swapTime}
                  aria-labelledby="discrete-slider"
                  valueLabelDisplay="auto"
                  min={0}
                  step={0.1}
                  max={10}
                  scale={(x) => timeScale(x)}
                  onChangeCommitted={(e, value) =>
                    this.changeSwapTime(e, timeScale(value))
                  }
                />
              </div>
            </div>
          </Drawer>
        </div>
      </div>
    );
  }
}

export default App;
