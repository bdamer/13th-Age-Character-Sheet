/**
 *	Copyright (c) 2015, Benjamin Damer
 *	All rights reserved.
 *
 *	Redistribution and use in source and binary forms, with or without modification,
 *	are permitted provided that the following conditions are met:
 *
 *	* Redistributions of source code must retain the above copyright notice, this
 *	  list of conditions and the following disclaimer.
 *
 *	* Redistributions in binary form must reproduce the above copyright notice, this
 *	  list of conditions and the following disclaimer in the documentation and/or
 *	  other materials provided with the distribution.
 *
 *	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 *	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 *	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 *	ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 *	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 *	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 *	ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 *	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

DATA = {
	BASE: 'data/',
	HP_PROGRESSION: [0, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
	AC_MOD: [ 'CONSTITUTION', 'DEXTERITY', 'WISDOM' ],
	PD_MOD: [ 'STRENGTH', 'CONSTITUTION', 'DEXTERITY' ],
	MD_MOD: [ 'INTELLIGENCE', 'WISDOM', 'CHARISMA' ],
	ABILITIES: {
		STRENGTH : { label: "STR" },
		CONSTITUTION : { label: "CON" },
		DEXTERITY : { label: "DEX" },
		INTELLIGENCE : { label: "INT" },
		WISDOM : { label: "WIS" },
		CHARISMA : { label: "CHA" }	
	},
	
	load: function() {
		var d1 = $.get(DATA.BASE + "classes.json", function(data) {
			DATA.CLASSES = data;
		});
		var d2 = $.get(DATA.BASE + "races.json", function(data) {
			DATA.RACES = data;		
		});
		var d3 = $.get(DATA.BASE + "feats.json", function(data) {
			DATA.FEATS = data;		
		});	
		return $.when(d1, d2, d3);
	},
	
	filterFeats: function(claz, race, level) {
		var res = [];
		for (var i in DATA.FEATS) {
			var f = DATA.FEATS[i];			
			if (claz && (-1 == $.inArray(claz, f.claz))) {
				continue;	// class requirement wasn't met
			}
			if (race && (-1 == $.inArray(race, f.race))) {
				continue;	// race requirement wasn't met
			}
			if (level && (-1 == $.inArray(level, f.level))) {
				continue;	// level requirement wasn't met
			}
			res.push(f);
		}
		return res;
	}
};

function Character(args) {
	args = args || {};
	//console.log("Creating new character", args);

	this.name = args.name || null;
	this.race = args.race || null;
	this.racialAbilityBonus = args.racialAbilityBonus || [];
	this.claz = args.claz || null;
	this.clazAbilityBonus = args.clazAbilityBonus || [];
	this.level = args.level || 1;
	this.initiative = args.initiative || 1;
	this.feats = args.feats || {};
	this.ac = args.ac || 0;
	this.pd = args.pd || 0;
	this.md = args.md || 0;	
	this.armorType = args.armorType || 0;
	this.attackPenalty = args.attackPenalty || 0;
	this.hasShield = args.hasShield || false;
	this.recoveries = args.recoveries || 0;
	this.recoveryDice = args.recoveryDice || 0;

	if (args.abilityScores) {
		this.abilityScores = args.abilityScores;
		this.modifiers = args.modifiers;		
	} else {
		this.abilityScores = {};
		this.modifiers = {};
		for (var i in DATA.ABILITIES) {
			this.abilityScores[i] = 0;
			this.modifiers[i] = 0;
		}	
	}
	
	// detail text fields:
	this.details = args.details || {};
}

Character.prototype.setAbilityScore = function(ability, score) {
	this.abilityScores[ability] = score;
	this.modifiers[ability] = Math.floor((this.getAbilityScoreTotal(ability) - 10) / 2);
};

Character.prototype.getAbilityScoreTotal = function(ability) {
	var res = this.abilityScores[ability];
	if (this.racialAbilityBonus.indexOf(ability) !== -1) {
		res += 2;
	} else if (this.clazAbilityBonus.indexOf(ability) !== -1) {
		res += 2;
	}
	return res;
};

Character.prototype.setRacialAbilityBonus = function(abilities) {
	this.racialAbilityBonus = abilities;
};

Character.prototype.setClazAbilityBonus = function(abilities) {
	this.clazAbilityBonus = abilities;
};

Character.prototype.setRace = function(race) {
	if (this.race) {		
		this.setRacialAbilityBonus([]);
	}
	this.race = race;
};

Character.prototype.setClaz = function(claz) {
	if (this.claz) {
		this.setClazAbilityBonus([]);
	}
	this.claz = claz;
};

Character.prototype.middleMod = function(mods) {
	var a = this.modifiers[mods[0]];
	var b = this.modifiers[mods[1]];
	var c = this.modifiers[mods[2]];
	return a + b + c - Math.max(a,b,c) - Math.min(a,b,c);
};
	
Character.prototype.computeStats = function() {
	var c = this.claz ? DATA.CLASSES[this.claz] : null;
	if (c) {
		this.hp = (c.baseHP + this.modifiers.CONSTITUTION) * DATA.HP_PROGRESSION[this.level];
		this.ac = c.baseAC[this.armorType];
		this.pd = c.basePD;
		this.md = c.baseMD;
		this.attackPenalty = c.attackPenalty[this.armorType];
		this.recoveries = c.recoveries;
		this.recoveryDice = c.recoveryDice;
		if (this.hasShield) {
			this.ac += c.baseAC[3];
			this.attackPenalty += c.attackPenalty[3];		
		}
	} else {
		this.hp = 0;
		this.ac = 0;
		this.pd = 0;
		this.md = 0;
		this.recoveries = 0;
		this.recoveryDice = 0;
		this.attackPenalty = 0;
	}
	this.initiative = this.level + this.modifiers['DEXTERITY'];
	this.ac += this.middleMod(DATA.AC_MOD) + this.level;
	this.pd += this.middleMod(DATA.PD_MOD) + this.level;
	this.md += this.middleMod(DATA.MD_MOD) + this.level;
};

Character.prototype.getRacialPowers = function() {
	return this.race ? DATA.filterFeats(null, this.race, 'RACIAL') : [];
};

Character.prototype.getClazFeatures = function() {
	return this.claz ? DATA.filterFeats(this.claz, null, 'CLASS') : [];
};

Character.prototype.getDamageMultiplier = function() {
	return Math.ceil(this.level / 4);
};

Character.prototype.getHighestModifier = function(attributes) {
	var best = -1;
	var val = -100;
	for (var i in attributes) {
		var cur = this.modifiers[attributes[i]];
		if (cur > val) {
			val = cur;
			best = i;
		}
	}
	return attributes[best];
};