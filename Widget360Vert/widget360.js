class VerticalRotater {
    #div;
    #sources;
    #frames = [];
    #currentFrame = 0;
    #canvas;
    #canvasContext;
    #y;
    #isRotation = false;
    #observer;

    constructor(id) {
        this.#div = document.getElementById(id);
        this.#sources = this.#div.getElementsByTagName('img');
        this.#canvas = this.#div.getElementsByTagName('canvas')[0];
        this.#canvasContext = this.#canvas.getContext("2d");
    }

    static async initialize(id) {
        const rotater = new VerticalRotater(id);
        await rotater.#init();
        return rotater;
    }

    async #init() {
        let promise = this.#preloadImages()
            .then(() => {
                const length = this.#sources.length;
                for (var i = length - 1; i >= 0; i--) {
                    const img = this.#sources[i];
                    this.#div.removeChild(img);
                }

                this.#drawCurrent();
        
                const options = {
                    root: null,
                    rootMargin: "0px",
                    threshold: 0.8,
                };
                this.#observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting && entries[0].target === this.#div) {
                        this.#observer?.unobserve(this.#div);
                        this.runInitialRotation();
                    }
                }, options);
                this.#observer.observe(this.#div);

                this.#div.addEventListener('pointerdown', (e) => this.beginRotation(e), true);
                this.#div.addEventListener('pointermove', (e) => this.rotate(e), true);
                this.#div.addEventListener('pointerup', (e) => this.endRotation(e), true);
            })
            .catch(() => this.#div.innerText = "At least one image failed to load");

        await promise;
    }

    async #preloadImages() {
        const LoadImage = (img) => {
            return new Promise((resolve, reject) => {
                var newImage = new Image();
                newImage.onload = () => {
                    resolve(newImage);
                };
                newImage.onerror = newImage.onabort = () => {
                    reject(newImage);
                };

                newImage.src = img.src;
                newImage.width = img.width;
                newImage.height = img.height;
                newImage.style.width = img.style.width;
                newImage.style.height  = img.style.height;
                this.#frames.push(newImage);
            });
        }

        var promises = [];
        const length = this.#sources.length;
        for (var i = 0; i < length; i++) {
            promises.push(LoadImage(this.#sources[i]));
        }
        return await Promise.all(promises);
    }

    runInitialRotation() {
        this.#isRotation = true;
        const milliseconds = 15;
        let count = 0;
        let timerId;
        const ShowPrevImage = () => {
            count++;
            if (count > this.#frames.length) {
                clearInterval(timerId);
                this.#isRotation = false;
            } else {
                this.#showPrev();
            }
        }

        timerId = setInterval(() => ShowPrevImage(), milliseconds);
    }

    beginRotation(e) {
        if (this.#isRotation) {
            return;
        }

        e.preventDefault();
        this.#div.setPointerCapture(e.pointerId);
        this.#y = e.y;
        this.#isRotation = true;
    }

    rotate(e) {
        e.preventDefault();
        if (!this.#isRotation) {
            return;
        }

        const delta = 10;
        const y = e.y;
        if (y > this.#y + delta) {
            this.#showPrev();
            this.#y = y;
        } else if (y < this.#y - delta) {
            this.#showNext();
            this.#y = y;
        }
    }

    endRotation(e) {
        this.#isRotation = false;
        this.#div.releasePointerCapture(e.pointerId);
    }

    #showPrev() {
        this.#currentFrame--;
        if (this.#currentFrame < 0) {
            this.#currentFrame = this.#frames.length - 1;
        }

        this.#drawCurrent();
    }

    #showNext() {
        this.#currentFrame++;
        if (this.#currentFrame >= this.#frames.length) {
            this.#currentFrame = 0;
        }

        this.#drawCurrent();
    }

    #drawCurrent() {
        const gradient = this.#canvasContext.createLinearGradient(0, 600, 0, 0);
        gradient.addColorStop(0, "#93D0E0");
        gradient.addColorStop(1, "#97EFF0");
        this.#canvasContext.fillStyle = gradient;
        this.#canvasContext.fillRect(0, 0, 600, 600);
        this.#canvasContext.drawImage(this.#frames[this.#currentFrame], 0, 0, this.#canvas.width, this.#canvas.height);
    }
}
