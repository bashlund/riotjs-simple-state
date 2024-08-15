# riotjs-simple-state

A straight forward centralized state management system for RiotJS in ~150 lines of TypeScript.

## Installation

```sh
npm i riotjs-simple-state
```

In `main.js`:

```js
import {StateController} from "riotjs-simple-state";

const stateController = new StateController();

riot.install(function(component) {
    component.stateController = stateController;
});
```

Now, every riotjs component will have the `stateController` object accessible  as `this.stateController`.

## Usage

One of your components must create the state, then any component can retrieve the state and update the state.

```js
onBeforeMount(props, state) {
    // Create state on before mount so it is existing prior to initing child components.
    //
    this.stateController.create("myState", {a: 1});

    // watch can be done in same component creating the state and/or in any other component using the state.
    //
    this.stateController.watch("myState", myState => {
        this.myState = myState;
        this.update();
    );

    // or to only load the state once, do:
    //
    this.stateController.load("myState").then( myState => {
        this.myState = myState;

        this.update();
    }
}

onUnmounted(props, state) {
    // delete state on unmount so that child components are already unmounted.
    //
    this.stateController.delete("myState");
}

// At some point you want to share the updated state with other components interested, do:
//
this.stateController.publish("myState", this.myState);

// the `.ref` can be be used to share data without publishing it.
// Features such as watch() cannot be used with `.ref`.
//
this.stateController.ref.databaseConnection.fetch(...);
```

A good practice is to only allow one writer for each state. But it is OK to have multiple writers,
however the programmer must make sure there are no concurrent updates ofr the state since that is
a race condition which can give unexpected results. Also, make sure that changes to state is made
to latest state object retrieved by load() or watch().
