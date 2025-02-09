class Rotater {
    #div;
    #frames;
    #currentFrame = 0;
    #x;
    #isRotation = false;
    #observer;

    constructor(id) {
        this.#div = document.getElementById(id);
        this.#frames = this.#div.getElementsByTagName('img');
    }

    static async initialize(id) {
        const rotater = new Rotater(id);
        await rotater.#init();
        return rotater;
    }

    async #init() {
        let promise = this.#preloadImages()
            .then(() => {
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

                // Set up the new image
                newImage.src = img.src;
                Rotater.Hide(newImage);
                // Insert new image and remove old
                img.parentNode.insertBefore(newImage, img);
                img.parentNode.removeChild(img);
            });
        }

        var promises = [];
        for (var i = 1; i < this.#frames.length; i++) {
            promises.push(LoadImage(this.#frames[i]));
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
        this.#x = e.x;
        this.#isRotation = true;
    }

    rotate(e) {
        e.preventDefault();
        if (!this.#isRotation) {
            return;
        }

        const delta = 10;
        const x = e.x;
        if (x > this.#x + delta) {
            this.#showPrev();
            this.#x = x;
        } else if (x < this.#x - delta) {
            this.#showNext();
            this.#x = x;
        }
    }

    endRotation(e) {
        this.#isRotation = false;
        this.#div.releasePointerCapture(e.pointerId);
    }

    #showPrev() {
        const oldIndex = this.#currentFrame;
        this.#currentFrame--;
        if (this.#currentFrame < 0) {
            this.#currentFrame = this.#frames.length - 1;
        }

        Rotater.Show(this.#frames[this.#currentFrame]);
        Rotater.Hide(this.#frames[oldIndex]);
    }

    #showNext() {
        const oldIndex = this.#currentFrame;
        this.#currentFrame++;
        if (this.#currentFrame >= this.#frames.length) {
            this.#currentFrame = 0;
        }

        Rotater.Show(this.#frames[this.#currentFrame]);
        Rotater.Hide(this.#frames[oldIndex]);
    }

    static Show(element) {
        element.style.display = '';
    }

    static Hide(element) {
        element.style.display = 'none';
    }
}