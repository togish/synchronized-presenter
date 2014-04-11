#Convention rule sheet
In order to maintain a readable and consistent codebase the code conventions # 
is described here:

Classes is defined by this example:
```javascript
var ClassName = function(requiredParameter){
    // All public variables
    this.publicVariable = 0;

    // All private variables
    var _this = this;
    var _privateVariable = 0;

    // All public functions
    this.publicFunction = function(){};

    // All private functions
    var _privateFunction = function(){};

    // Initialization closure
    (function(){
        // Initialization code
    })();
};
```