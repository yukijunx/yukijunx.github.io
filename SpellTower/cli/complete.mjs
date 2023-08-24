/**
 * For use with prompt-sync to allow auto-completing inputs. 
 * @param {*} commands the list of expected inputs. 
 * @returns a callback function to turn a partial input to a known command. 
 */
export default function complete(commands) {
    return function (str) {
        var i;
        var ret = [];
        for (i = 0; i < commands.length; i++) {
            if (commands[i].indexOf(str) == 0)
                ret.push(commands[i]);
        }
        return ret;
    };
}
;
