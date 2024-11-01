/*
    HMH RIV SCRIPT MODULE
    For:    timer.riv
    By:     E. Ó Drisceoil
    ---------------------------------------
    An example script module, adding special functions for a particular .riv file.

    A primary use for this would be in handling file-specific Rive event reports,
    but it could also be used for adding special behaviour to the Rive's onLoad function,
    the onAdvance function, creating more advanced listeners beyond what's possible with
    in-editor listeners (e.g. clicks outside the canvas, distinguishing L/R/Middle clicks,
    keyboard/controller input listeners).
    
    You could conditionally manipulate the transforms of name-exported layers,
    edit name-exported text-runs (passing in current time for example),
    check if it's currently December (and set an input that adds snow to an animation),
    add wobbly spring dynamics to input values (based on a goal_value, current_value, and delta-time),
    or countless other things!

    TO-DO: expand on this, and try putting the "Yellow/Red Counters" interactive into this format!   
*/

export const name = "timer";
let hmhRive = undefined;           //Class reference
let hmhRiveInstance = undefined;   //Instance reference

/* SETUP */
export class setup {
    static setClass(hmhRiveClass){
        hmhRive = hmhRiveClass;
    }
    static setInstance(instance){
        hmhRiveInstance = instance;
    }
}

/* ENTRY-POINT FUNCTIONS 
(The Rive component will call these entry-point methods when they're found in the module) */
export class entrypoints {
    static onLoad_pre(){
        if (hmhRiveInstance.DEBUG.SCRIPT_MODULE)
        console.log(`%cLOADED - PRE | Custom behaviour goes here!`, hmhRive.LOG_STYLES.SCRIPT_MODULE);

        //Example of getting an instance-level attribute (and class-level)
        console.log(`%c${hmhRiveInstance.getActiveArtboard()}`, hmhRive.LOG_STYLES.SCRIPT_MODULE);
    }

    static onLoad_post(){
        if (hmhRiveInstance.DEBUG.SCRIPT_MODULE)
        console.log(`%cLOADED - POST | Custom behaviour goes here!`, hmhRive.LOG_STYLES.SCRIPT_MODULE);

        animationState = hmhRiveInstance.inputs.find(input => input.name == "EXPORT_animationState");
        handInput = hmhRiveInstance.inputs.find(input => input.name == "HandRotation");
    }

    static onEvent(riveEvent){
        if (hmhRiveInstance.DEBUG.SCRIPT_MODULE)
        console.log(`%cEVENT | Custom behaviour goes here!`, hmhRive.LOG_STYLES.SCRIPT_MODULE);
        
        switch (riveEvent.data.name){
            case 'testEvent':   return console.log("Hi!");
        }
    }

    static onAdvance(deltaTime){
        if (hmhRiveInstance.time == undefined)
            hmhRiveInstance.time = deltaTime;
        else
            hmhRiveInstance.time += deltaTime;

        //console.log(`%cADVANCE | ${hmhRiveInstance.time.toFixed(2)}`, hmhRive.LOG_STYLES.SCRIPT_MODULE);

        if (animationState && handInput)
        setHandRotation(deltaTime);
    }

    static onStateChange(changes){
        //console.log(`%cSTATE CHANGE | \n${changes.join("\n")}`, hmhRive.LOG_STYLES.SCRIPT_MODULE);

        stateInfo = changes;
    }
}

/* LOCAL FUNCTIONS 
(These functions can be called by the entry-point functions, or anywhere else!) */

let stateInfo = undefined;

let animationState = undefined;
let handInput = undefined;

/** Advances the clock hand's rotation when "animationState" == 1, and resets the rotation to 0 when "animationState" == 0
 * 
 *  This is used to preserve the hand's current rotation when going from (animationState_2 => animationState_1) (resuming the countdown)
 */
function setHandRotation(deltaTime){
    if (handInput.iterator == undefined)
        handInput.iterator = new springIterator(handInput, springIterator.types.rotationalFloor, 800);

    if (animationState.value == 0){
        handInput.iterator.goalValue = 0;
        handInput.iterator.type = springIterator.types.rotationalFloor; //Ensures it resets in an anticlockwise way
    }
    else if (animationState.value == 1){
        handInput.iterator.goalValue += 360/4*deltaTime;
        handInput.iterator.type = springIterator.types.rotational;
    }
    else if (animationState.value == 2){
        handInput.iterator.velocity = 0;
        handInput.iterator.type = springIterator.types.rotational;
    }

    handInput.iterator.iterate(deltaTime);
}

/** A custom class for iterating an Input value towards a goal value in a bouncy/springy way */
class springIterator {
    /** The "rotational" type will handle wrapping the value when it leaves the 0-360 range, 
     * and will take the shortest angular path towards the goal. 
     * 
     * "rotationalFloor" is similar, except it doesn't take the shortest angular path.
     * (Useful to ensure a clock hand always resets to 0 in an anticlockwise way) */
    static types = {
        default: 0,
        rotational: 1,
        rotationalFloor: 2,
    }

    constructor(inputToUpdate, type, maxVelocity, damping, tension, goalValue, velocity){
        if (goalValue == undefined) goalValue = inputToUpdate.value;
        if (velocity == undefined) velocity = 0;
        if (type == undefined) type = springIterator.types.default;
        this.type = type;
        this.maxVelocity = maxVelocity;

        if (this.type == springIterator.types.default){
            if (damping == undefined) damping = 12;
            if (tension == undefined) tension = 0.75;
        }
        else if ([springIterator.types.rotational, springIterator.types.rotationalFloor].includes(this.type)){           
            if (damping == undefined) damping = 13;
            if (tension == undefined) tension = 4.75;
        }
        this.damping = damping;
        this.tension = tension;

        this.inputToUpdate = inputToUpdate;
        this.currentValue = inputToUpdate.value;
        this.goalValue = goalValue;
        this.velocity = velocity;
    }

    /** Step towards the goal value, as a function of the current value, the current velocity, and deltaTime (and the spring constants) */
    iterate(deltaTime){
        if (this.type == springIterator.types.default)
            this.springDamping(deltaTime);
        else if (this.type == springIterator.types.rotational)
            this.springDamping_rotational(deltaTime);
        else if (this.type == springIterator.types.rotationalFloor)
            this.springDamping_rotational_floor(deltaTime);

        //Wrap the value (since only values between 0-360 inclusive do anything to the State Machine!)
        this.inputToUpdate.value = springIterator.moduloUnsigned(this.currentValue, 360);
    }

    springDamping_rotational(deltaTime){
        if (isNaN(this.currentValue) || isNaN(this.goalValue))
            return;

        let distanceFromGoal = this.currentValue - this.goalValue;
        if (distanceFromGoal >= 180){
            this.currentValue -= 360;
            distanceFromGoal = this.currentValue - this.goalValue;
        }
        this.velocity = (1 - this.damping*deltaTime)*this.velocity - distanceFromGoal*this.tension;
        if (this.maxVelocity != undefined){
            if (this.velocity > this.maxVelocity) this.velocity = this.maxVelocity;
            else if (this.velocity < -this.maxVelocity) this.velocity = -this.maxVelocity;
        }
        this.currentValue = this.currentValue + this.velocity*deltaTime;
    
        //Wrap the rotational values
        if (this.currentValue >= 360){
            this.currentValue -= 360;
            this.goalValue -= 360;
        }
        else if (this.currentValue < 0){
            this.currentValue += 360;
            this.goalValue += 360;
        }
    }

    springDamping_rotational_floor(deltaTime){
        if (isNaN(this.currentValue) || isNaN(this.goalValue))
            return;

        let distanceFromGoal = this.currentValue - this.goalValue;
        //console.log(this.currentValue.toFixed(2), this.goalValue.toFixed(2), distanceFromGoal.toFixed(2), this.inputToUpdate.value.toFixed(2));

        this.velocity = (1 - this.damping*deltaTime)*this.velocity - distanceFromGoal*this.tension;
        if (this.maxVelocity != undefined){
            if (this.velocity > this.maxVelocity) this.velocity = this.maxVelocity;
            else if (this.velocity < -this.maxVelocity) this.velocity = -this.maxVelocity;
        }
        this.currentValue = this.currentValue + this.velocity*deltaTime;
    
        //Wrap the rotational values
        this.goalValue = springIterator.moduloUnsigned(this.goalValue, 360);
    }

    springDamping(deltaTime){
        if (isNaN(this.currentValue) || isNaN(this.goalValue))
            return;
        
        this.velocity = (1 - this.damping*deltaTime)*this.velocity - (this.currentValue - this.goalValue)*this.tension;
        if (this.maxVelocity != undefined){
            if (this.velocity > this.maxVelocity) this.velocity = this.maxVelocity;
            else if (this.velocity < -this.maxVelocity) this.velocity = -this.maxVelocity;
        }
        this.value = this.currentValue + this.velocity*deltaTime;
    }

    /** Gets signed values' modulo in such a way that: 
     *      moduloUnsigned(-5, 4) == 3
     * 
     *  JavaScript's inbuild modulo handles signed values in a different way (which is less convenient for angular wrapping), giving:
     *      (-5 % 4) == -1 */
    static moduloUnsigned(number, modulus){
        return ((number % modulus) + modulus) % modulus;
    }
};