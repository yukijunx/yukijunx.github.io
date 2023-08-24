const defaultHyperParams = {
    lengthMult: 1,
    lengthReqMults: new Map([[3, 0], [4, 1], [5, 1], [6, 1]]),
    shortThreshold: 3,
    shortPenalty: 10,
    log10ScoreMult: 1,
    blocksMult: 1,
    edgeProportionMult: 1,
    basicShapeRatingMult: 1,
    dangerColBoost: 10,
    dangerColMult: 1,
    boardShapeRatingMult: 5,
    dangerZone: 3,
    addNewRowBoost: 5,
    robbedQsPenaltyMult: 1,
}

export default class Word {

    static setHyperParams(multsObject) {
        for (const [key, value] of Object.entries({ ...defaultHyperParams, ...multsObject })) {
            Word[key] = value;
        }
    }

    static restoreDefaultHyperParams() {
        this.setHyperParams({});
    }

    constructor({ plaintext, path, score, lengthReqs, alreadyPlayed,
        blockNeighbourCount, minLength, edgeProportion, basicShapeRating,
        dangerColCount, boardShapeRating, robbedQs }
    ) {
        this._plaintext = plaintext;
        this._path = path;
        this._length = path.length;
        this._lengthReqs = lengthReqs;
        this._alreadyPlayed = alreadyPlayed ?? false;
        this._score = score ?? 0;
        this._blockNeighbourCount = blockNeighbourCount ?? 0;
        this._minLength = minLength;
        this._edgeProportion = edgeProportion;
        this._basicShapeRating = basicShapeRating;
        this._dangerColCount = dangerColCount;
        this._boardShapeRating = boardShapeRating;
        this._robbedQs = robbedQs;
        this.calcValue();
    }

    get score() {
        return this._score;
    }

    set score(score) {
        this._score = score;
    }

    get plaintext() {
        return this._plaintext;
    }

    get value() {
        return this._value;
    }

    calcValue() {
        this._value = 0;

        if (this._minLength > this._length || this._alreadyPlayed
            || this._boardShapeRating === false) {
            // words that cannot be played  
            this._value = false;
            return;
        }

        if (this._length == 0) {
            this._value += Word.addNewRowBoost;
        } else if (this._length <= Word.shortThreshold) {
            this._value -= Word.shortPenalty;
        } else {
            this._value += this._length * Word.lengthMult;
        }

        this._lengthReqs.forEach((val, key) =>
            this._value += val * Word.lengthReqMults.get(key));
        this._value += Math.max(Math.log10(this._score), 1)
            * Word.log10ScoreMult;
        this._value += this._blockNeighbourCount * Word.blocksMult;
        this._value += this._edgeProportion * Word.edgeProportionMult;
        this._value += this._basicShapeRating * Word.basicShapeRatingMult;
        this._value += this._dangerColCount > 0 ? Word.dangerColBoost : 0;
        this._value += this._dangerColCount * Word.dangerColMult;
        this._value += this._boardShapeRating * Word.boardShapeRatingMult;
        this._value -= this._robbedQs * Word.robbedQsPenaltyMult;

        if (Number.isNaN(this._value)) {
            throw new TypeError(`All of these should be numbers: ` +
                [
                    `length: ${this._length} * ${Word.lengthMult}`,
                    `lengthReqs: ${Array.from(this._lengthReqs.entries())
                        .join(",")} *  ${Word.lengthReqMults}`,
                    `score: ${this._score} * ${Word.log10ScoreMult}`,
                    `blockNeighbourCount: ${this._blockNeighbourCount} * ${Word.blocksMult}`,
                    `edgeProportion: ${this._edgeProportion} * ${Word.edgeProportionMult}`,
                    `basicShapeRating: ${this._basicShapeRating} * ${Word.basicShapeRatingMult}`,
                    `dangerColCount: ${this._dangerColCount} * ${Word.dangerColMult} + ${Word.dangerColBoost}`,
                    `boardShapeRating: ${this._boardShapeRating} * ${Word.boardShapeRatingMult}`,
                    `robbedQs: ${this._robbedQs} * -${Word.robbedQsPenaltyMult}`,
                ].join(", ")
            );
        }
    }

}

Word.restoreDefaultHyperParams();

export { defaultHyperParams as defaultMults };
