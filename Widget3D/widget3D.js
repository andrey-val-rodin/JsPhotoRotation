class Rotater3D {
    #div;
    #sources;
    #frames = [];
    #currentPhoto = 0;
    #currentSeries = 0;
    #canvas;
    #canvasContext;
    #x;
    #y;
    #isRotation = false;
    #circularProgress;
    #progressValue;
    get SeriesCount() { return 6; }
    get PhotoInSeries() { return 24; }
    get TotalCount() { return this.SeriesCount * this.PhotoInSeries; }
    get CurrentPhoto() {
        const firstPhotoInSeries = this.#currentSeries * this.PhotoInSeries;
        return this.#frames[this.#currentPhoto + firstPhotoInSeries];
    }

    constructor(id) {
        this.#div = document.getElementById(id);
        this.#sources = this.#div.getElementsByTagName('img');
        this.#canvas = this.#div.getElementsByTagName('canvas')[0];
        this.#canvasContext = this.#canvas.getContext("2d");

        this.#circularProgress = document.querySelector(".circular-progress");
        this.#progressValue = document.querySelector(".progress-value");
        this.#progressValue.textContent = "0%";
    }

    static async initialize(id) {
        const rotater = new Rotater3D(id);
        await rotater.#init();
        return rotater;
    }

    async #init() {
        this.#canvas.style.display = 'none';

        let promise = this.#preloadImages()
            .then(() => {
                const length = this.#sources.length;
                for (var i = length - 1; i >= 0; i--) {
                    const img = this.#sources[i];
                    this.#div.removeChild(img);
                }

                this.#drawCurrent();
        
                this.#div.addEventListener('pointerdown', (e) => this.beginRotation(e), true);
                this.#div.addEventListener('pointermove', (e) => this.rotate(e), true);
                this.#div.addEventListener('pointerup', (e) => this.endRotation(e), true);
            })
            .catch(() => this.#div.innerText = "At least one image failed to load");
        await promise;

        this.#div.removeChild(document.querySelector(".container"));
        this.#canvas.style.display = '';
    }

    async #preloadImages() {
        let loaded = 0;
    
        const LoadImage = (img) => {
            return new Promise((resolve, reject) => {
                var newImage = new Image();
                newImage.onload = () => {
                    loaded++;
                    const currentProgress = loaded * 100 / length;
                    this.#progressValue.textContent = `${Math.round(currentProgress)}%`;
                    this.#circularProgress.style.background = `conic-gradient(#7d2ae8 ${currentProgress * 3.6}deg, #ededed 0deg)`;

                    resolve(newImage);
                };
                newImage.onerror = newImage.onabort = () => {
                    reject(newImage);
                };

                newImage.src = img.src;
                this.#frames.push(newImage);
            })};

        var promises = [];
        const length = this.#sources.length;
        for (var i = 0; i < length; i++) {
            promises.push(LoadImage(this.#sources[i]));
        }
        return await Promise.all(promises);
    }

    beginRotation(e) {
        if (this.#isRotation) {
            return;
        }

        e.preventDefault();
        this.#div.setPointerCapture(e.pointerId);
        this.#x = e.x;
        this.#y = e.y;
        this.#isRotation = true;
    }

    rotate(e) {
        e.preventDefault();
        if (!this.#isRotation) {
            return;
        }

        const xDelta = 50;
        const yDelta = 80;
        const x = e.x;
        const y = e.y;
        let newSeries = this.#currentSeries;
        let newPhoto = this.#currentPhoto;
        if (y > this.#y + yDelta) {
            newSeries = this.#deviateSeries(1);
            this.#y = y;
        } else if (y < this.#y - yDelta) {
            newSeries = this.#deviateSeries(-1);
            this.#y = y;
        }

        if (x > this.#x + xDelta) {
            newPhoto = this.#deviatePhoto(1);
            this.#x = x;
        } else if (x < this.#x - xDelta) {
            newPhoto = this.#deviatePhoto(-1);
            this.#x = x;
        }

        if (newPhoto !== this.#currentPhoto || newSeries !== this.#currentSeries) {
            this.#currentPhoto = newPhoto;
            this.#currentSeries = newSeries;
            this.#drawCurrent();
        }
    }

    endRotation(e) {
        this.#isRotation = false;
        this.#div.releasePointerCapture(e.pointerId);
    }

    #deviateSeries(deviation) {
        let currentSeries = this.#currentSeries;
        currentSeries += deviation;
        if (currentSeries < 0) {
            currentSeries = 0;
        } else if (currentSeries >= this.SeriesCount) {
            currentSeries = this.SeriesCount - 1;
        }

        return currentSeries;
    }

    #deviatePhoto(deviation) {
        let currentPhoto = this.#currentPhoto;
        currentPhoto += deviation;
        if (currentPhoto < 0) {
            currentPhoto = this.PhotoInSeries - 1;
        } else if (currentPhoto >= this.PhotoInSeries) {
            currentPhoto = 0;
        }

        return currentPhoto;
    }

    #drawCurrent() {
        this.#canvasContext.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        this.#canvasContext.drawImage(this.CurrentPhoto, 0, 0, this.#canvas.width, this.#canvas.height);
    }
}