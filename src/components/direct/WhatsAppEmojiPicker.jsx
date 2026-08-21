'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Clock,
  Smile,
  Leaf,
  Coffee,
  Trophy,
  Car,
  Lightbulb,
  Hash,
  Flag,
  Search,
  X,
  Sticker,
  Sparkles,
  Film,
} from 'lucide-react';
export const ALL_EMOJI_CATEGORIES = [
  {
    id: 'people',
    name: 'Smileys & People',
    emojis: [
      { char: '😀', name: 'Grinning Face' },
      { char: '😃', name: 'Grinning Face with Big Eyes' },
      { char: '😄', name: 'Grinning Face with Smiling Eyes' },
      { char: '😁', name: 'Beaming Face' },
      { char: '😆', name: 'Grinning Squinting Face' },
      { char: '😅', name: 'Grinning Face with Sweat' },
      { char: '🤣', name: 'Rolling on the Floor Laughing' },
      { char: '😂', name: 'Face with Tears of Joy' },
      { char: '🙂', name: 'Slightly Smiling Face' },
      { char: '🙃', name: 'Upside-Down Face' },
      { char: '😉', name: 'Winking Face' },
      { char: '😊', name: 'Smiling Face with Smiling Eyes' },
      { char: '😇', name: 'Smiling Face with Halo' },
      { char: '🥰', name: 'Smiling Face with Hearts' },
      { char: '😍', name: 'Heart-Eyes' },
      { char: '🤩', name: 'Star-Struck' },
      { char: '😘', name: 'Face Blowing a Kiss' },
      { char: '😗', name: 'Kissing Face' },
      { char: '😚', name: 'Kissing Face with Closed Eyes' },
      { char: '😋', name: 'Face Savoring Food' },
      { char: '😛', name: 'Face with Tongue' },
      { char: '😜', name: 'Winking Face with Tongue' },
      { char: '🤪', name: 'Zany Face' },
      { char: '😝', name: 'Squinting Face with Tongue' },
      { char: '🤑', name: 'Money-Mouth Face' },
      { char: '🤗', name: 'Hugging Face' },
      { char: '🤭', name: 'Face with Hand Over Mouth' },
      { char: '🤫', name: 'Shushing Face' },
      { char: '🤔', name: 'Thinking Face' },
      { char: '🤐', name: 'Zipper-Mouth Face' },
      { char: '🤨', name: 'Face with Raised Eyebrow' },
      { char: '😐', name: 'Neutral Face' },
      { char: '😑', name: 'Expressionless Face' },
      { char: '😶', name: 'Face Without Mouth' },
      { char: '😏', name: 'Smirking Face' },
      { char: '😒', name: 'Unamused Face' },
      { char: '🙄', name: 'Face with Rolling Eyes' },
      { char: '😬', name: 'Grimacing Face' },
      { char: '🤥', name: 'Lying Face' },
      { char: '😌', name: 'Relieved Face' },
      { char: '😔', name: 'Pensive Face' },
      { char: '😪', name: 'Sleepy Face' },
      { char: '🤤', name: 'Drooling Face' },
      { char: '😴', name: 'Sleeping Face' },
      { char: '😷', name: 'Face with Medical Mask' },
      { char: '🤒', name: 'Face with Thermometer' },
      { char: '🤕', name: 'Face with Head-Bandage' },
      { char: '🤢', name: 'Nauseated Face' },
      { char: '🤮', name: 'Face Vomiting' },
      { char: '🤧', name: 'Sneezing Face' },
      { char: '🥵', name: 'Hot Face' },
      { char: '🥶', name: 'Cold Face' },
      { char: '🥴', name: 'Woozy Face' },
      { char: '😵', name: 'Dizzy Face' },
      { char: '🤯', name: 'Exploding Head' },
      { char: '🤠', name: 'Cowboy Hat Face' },
      { char: '🥳', name: 'Partying Face' },
      { char: '😎', name: 'Smiling Face with Sunglasses' },
      { char: '🤓', name: 'Nerd Face' },
      { char: '🧐', name: 'Face with Monocle' },
      { char: '😕', name: 'Confused Face' },
      { char: '😟', name: 'Worried Face' },
      { char: '🙁', name: 'Slightly Frowning Face' },
      { char: '😮', name: 'Face with Open Mouth' },
      { char: '😯', name: 'Hushed Face' },
      { char: '😲', name: 'Astonished Face' },
      { char: '😳', name: 'Flushed Face' },
      { char: '🥺', name: 'Pleading Face' },
      { char: '😦', name: 'Frowning Face with Open Mouth' },
      { char: '😧', name: 'Anguished Face' },
      { char: '😨', name: 'Fearful Face' },
      { char: '😰', name: 'Anxious Face with Sweat' },
      { char: '😥', name: 'Sad but Relieved Face' },
      { char: '😢', name: 'Crying Face' },
      { char: '😭', name: 'Loudly Crying Face' },
      { char: '😱', name: 'Face Screaming in Fear' },
      { char: '😖', name: 'Confounded Face' },
      { char: '😣', name: 'Persevering Face' },
      { char: '😞', name: 'Disappointed Face' },
      { char: '😓', name: 'Downcast Face with Sweat' },
      { char: '😩', name: 'Weary Face' },
      { char: '😫', name: 'Tired Face' },
      { char: '🥱', name: 'Yawning Face' },
      { char: '😤', name: 'Face with Steam From Nose' },
      { char: '😡', name: 'Pouting Face' },
      { char: '😠', name: 'Angry Face' },
      { char: '🤬', name: 'Face with Symbols on Mouth' },
      { char: '😈', name: 'Smiling Face with Horns' },
      { char: '👿', name: 'Angry Face with Horns' },
      { char: '💀', name: 'Skull' },
      { char: '☠️', name: 'Skull and Crossbones' },
      { char: '💩', name: 'Pile of Poo' },
      { char: '🤡', name: 'Clown Face' },
      { char: '👹', name: 'Ogre' },
      { char: '👺', name: 'Goblin' },
      { char: '👻', name: 'Ghost' },
      { char: '👽', name: 'Alien' },
      { char: '👾', name: 'Alien Monster' },
      { char: '🤖', name: 'Robot' },
      { char: '👋', name: 'Waving Hand' },
      { char: '🤚', name: 'Raised Back of Hand' },
      { char: '🖐️', name: 'Hand with Fingers Splayed' },
      { char: '✋', name: 'Raised Hand' },
      { char: '🖖', name: 'Vulcan Salute' },
      { char: '👌', name: 'OK Hand' },
      { char: '🤌', name: 'Pinched Fingers' },
      { char: '🤏', name: 'Pinching Hand' },
      { char: '✌️', name: 'Victory Hand' },
      { char: '🤞', name: 'Crossed Fingers' },
      { char: '🤟', name: 'Love-You Gesture' },
      { char: '🤘', name: 'Sign of the Horns' },
      { char: '🤙', name: 'Call Me Hand' },
      { char: '👈', name: 'Backhand Index Pointing Left' },
      { char: '👉', name: 'Backhand Index Pointing Right' },
      { char: '👆', name: 'Backhand Index Pointing Up' },
      { char: '🖕', name: 'Middle Finger' },
      { char: '👇', name: 'Backhand Index Pointing Down' },
      { char: '☝️', name: 'Index Pointing Up' },
      { char: '👍', name: 'Thumbs Up' },
      { char: '👎', name: 'Thumbs Down' },
      { char: '✊', name: 'Raised Fist' },
      { char: '👊', name: 'Oncoming Fist' },
      { char: '🤛', name: 'Left-Facing Fist' },
      { char: '🤜', name: 'Right-Facing Fist' },
      { char: '👏', name: 'Clapping Hands' },
      { char: '🙌', name: 'Raising Hands' },
      { char: '👐', name: 'Open Hands' },
      { char: '🤲', name: 'Palms Up Together' },
      { char: '🤝', name: 'Handshake' },
      { char: '🙏', name: 'Folded Hands' },
      { char: '💪', name: 'Flexed Biceps' },
      { char: '🧠', name: 'Brain' },
      { char: '👀', name: 'Eyes' },
      { char: '👁️', name: 'Eye' },
      { char: '👅', name: 'Tongue' },
      { char: '👄', name: 'Mouth' },
      { char: '❤️', name: 'Red Heart' },
      { char: '🧡', name: 'Orange Heart' },
      { char: '💛', name: 'Yellow Heart' },
      { char: '💚', name: 'Green Heart' },
      { char: '💙', name: 'Blue Heart' },
      { char: '💜', name: 'Purple Heart' },
      { char: '🖤', name: 'Black Heart' },
      { char: '🤍', name: 'White Heart' },
      { char: '🤎', name: 'Brown Heart' },
      { char: '💔', name: 'Broken Heart' },
      { char: '❣️', name: 'Heart Exclamation' },
      { char: '💕', name: 'Two Hearts' },
      { char: '💞', name: 'Revolving Hearts' },
      { char: '💓', name: 'Beating Heart' },
      { char: '💗', name: 'Growing Heart' },
      { char: '💖', name: 'Sparkling Heart' },
      { char: '💘', name: 'Heart with Arrow' },
      { char: '💝', name: 'Heart with Ribbon' },
      { char: '🔥', name: 'Fire' },
      { char: '✨', name: 'Sparkles' },
      { char: '🌟', name: 'Glowing Star' },
      { char: '💫', name: 'Dizzy' },
      { char: '💥', name: 'Collision' },
      { char: '💯', name: 'Hundred Points' },
    ],
  },
  {
    id: 'nature',
    name: 'Animals & Nature',
    emojis: [
      { char: '🐶', name: 'Dog Face' },
      { char: '🐱', name: 'Cat Face' },
      { char: '🐭', name: 'Mouse Face' },
      { char: '🐹', name: 'Hamster' },
      { char: '🐰', name: 'Rabbit Face' },
      { char: '🦊', name: 'Fox' },
      { char: '🐻', name: 'Bear' },
      { char: '🐼', name: 'Panda' },
      { char: '🐨', name: 'Koala' },
      { char: '🐯', name: 'Tiger Face' },
      { char: '🦁', name: 'Lion' },
      { char: '🐮', name: 'Cow Face' },
      { char: '🐷', name: 'Pig Face' },
      { char: '🐸', name: 'Frog' },
      { char: '🐵', name: 'Monkey Face' },
      { char: '🙈', name: 'See-No-Evil Monkey' },
      { char: '🙉', name: 'Hear-No-Evil Monkey' },
      { char: '🙊', name: 'Speak-No-Evil Monkey' },
      { char: '🐒', name: 'Monkey' },
      { char: '🐔', name: 'Chicken' },
      { char: '🐧', name: 'Penguin' },
      { char: '🐦', name: 'Bird' },
      { char: '🐤', name: 'Baby Chick' },
      { char: '🦆', name: 'Duck' },
      { char: '🦅', name: 'Eagle' },
      { char: '🦉', name: 'Owl' },
      { char: '🦇', name: 'Bat' },
      { char: '🐺', name: 'Wolf' },
      { char: '🐗', name: 'Boar' },
      { char: '🐴', name: 'Horse Face' },
      { char: '🦄', name: 'Unicorn' },
      { char: '🐝', name: 'Honeybee' },
      { char: '🐛', name: 'Bug' },
      { char: '🦋', name: 'Butterfly' },
      { char: '🐌', name: 'Snail' },
      { char: '🐞', name: 'Lady Beetle' },
      { char: '🐜', name: 'Ant' },
      { char: '🦟', name: 'Mosquito' },
      { char: '🦗', name: 'Cricket' },
      { char: '🕷️', name: 'Spider' },
      { char: '🦂', name: 'Scorpion' },
      { char: '🐢', name: 'Turtle' },
      { char: '🐍', name: 'Snake' },
      { char: '🦎', name: 'Lizard' },
      { char: '🦖', name: 'T-Rex' },
      { char: '🦕', name: 'Sauropod' },
      { char: '🐙', name: 'Octopus' },
      { char: '🦑', name: 'Squid' },
      { char: '🦐', name: 'Shrimp' },
      { char: '🦞', name: 'Lobster' },
      { char: '🦀', name: 'Crab' },
      { char: '🐡', name: 'Blowfish' },
      { char: '🐠', name: 'Tropical Fish' },
      { char: '🐟', name: 'Fish' },
      { char: '🐬', name: 'Dolphin' },
      { char: '🐳', name: 'Spouting Whale' },
      { char: '🐋', name: 'Whale' },
      { char: '🦈', name: 'Shark' },
      { char: '🐊', name: 'Crocodile' },
      { char: '🐅', name: 'Tiger' },
      { char: '🐆', name: 'Leopard' },
      { char: '🦓', name: 'Zebra' },
      { char: '🦍', name: 'Gorilla' },
      { char: '🦧', name: 'Orangutan' },
      { char: '🐘', name: 'Elephant' },
      { char: '🦛', name: 'Hippopotamus' },
      { char: '🦏', name: 'Rhinoceros' },
      { char: '🐪', name: 'Camel' },
      { char: '🐫', name: 'Two-Hump Camel' },
      { char: '🦒', name: 'Giraffe' },
      { char: '🦘', name: 'Kangaroo' },
      { char: '🐃', name: 'Water Buffalo' },
      { char: '🐂', name: 'Ox' },
      { char: '🐄', name: 'Cow' },
      { char: '🐎', name: 'Horse' },
      { char: '🐖', name: 'Pig' },
      { char: '🐏', name: 'Ram' },
      { char: '🐑', name: 'Ewe' },
      { char: '🦙', name: 'Llama' },
      { char: '🐐', name: 'Goat' },
      { char: '🦌', name: 'Deer' },
      { char: '🐕', name: 'Dog' },
      { char: '🐩', name: 'Poodle' },
      { char: '🐈', name: 'Cat' },
      { char: '🐓', name: 'Rooster' },
      { char: '🦃', name: 'Turkey' },
      { char: '🦚', name: 'Peacock' },
      { char: '🦜', name: 'Parrot' },
      { char: '🦢', name: 'Swan' },
      { char: '🦩', name: 'Flamingo' },
      { char: '🕊️', name: 'Dove' },
      { char: '🐇', name: 'Rabbit' },
      { char: '🦝', name: 'Raccoon' },
      { char: '🦨', name: 'Skunk' },
      { char: '🦡', name: 'Badger' },
      { char: '🦦', name: 'Otter' },
      { char: '🦥', name: 'Sloth' },
      { char: '🐁', name: 'Mouse' },
      { char: '🐀', name: 'Rat' },
      { char: '🐿️', name: 'Chipmunk' },
      { char: '🦔', name: 'Hedgehog' },
      { char: '🐾', name: 'Paw Prints' },
      { char: '🐉', name: 'Dragon' },
      { char: '🐲', name: 'Dragon Face' },
      { char: '🌵', name: 'Cactus' },
      { char: '🎄', name: 'Christmas Tree' },
      { char: '🌲', name: 'Evergreen Tree' },
      { char: '🌳', name: 'Deciduous Tree' },
      { char: '🌴', name: 'Palm Tree' },
      { char: '🌱', name: 'Seedling' },
      { char: '🌿', name: 'Herb' },
      { char: '☘️', name: 'Shamrock' },
      { char: '🍀', name: 'Four Leaf Clover' },
      { char: '🎍', name: 'Pine Decoration' },
      { char: '🎋', name: 'Tanabata Tree' },
      { char: '🍃', name: 'Leaf Fluttering in Wind' },
      { char: '🍂', name: 'Fallen Leaf' },
      { char: '🍁', name: 'Maple Leaf' },
      { char: '🍄', name: 'Mushroom' },
      { char: '🌾', name: 'Sheaf of Rice' },
      { char: '💐', name: 'Bouquet' },
      { char: '🌷', name: 'Tulip' },
      { char: '🌹', name: 'Rose' },
      { char: '🥀', name: 'Wilted Flower' },
      { char: '🌺', name: 'Hibiscus' },
      { char: '🌸', name: 'Cherry Blossom' },
      { char: '🌼', name: 'Blossom' },
      { char: '🌻', name: 'Sunflower' },
      { char: '🌞', name: 'Sun with Face' },
      { char: '🌝', name: 'Full Moon Face' },
      { char: '🌛', name: 'First Quarter Moon Face' },
      { char: '🌜', name: 'Last Quarter Moon Face' },
      { char: '🌚', name: 'New Moon Face' },
      { char: '🌕', name: 'Full Moon' },
      { char: '🌖', name: 'Waning Gibbous Moon' },
      { char: '🌗', name: 'Last Quarter Moon' },
      { char: '🌘', name: 'Waning Crescent Moon' },
      { char: '🌑', name: 'New Moon' },
      { char: '🌒', name: 'Waxing Crescent Moon' },
      { char: '🌓', name: 'First Quarter Moon' },
      { char: '🌔', name: 'Waxing Gibbous Moon' },
      { char: '🌙', name: 'Crescent Moon' },
      { char: '🌎', name: 'Globe Showing Americas' },
      { char: '🌍', name: 'Globe Showing Europe-Africa' },
      { char: '🌏', name: 'Globe Showing Asia-Australia' },
      { char: '🪐', name: 'Ringed Planet' },
      { char: '💫', name: 'Dizzy' },
      { char: '⭐', name: 'Star' },
      { char: '🌟', name: 'Glowing Star' },
      { char: '✨', name: 'Sparkles' },
      { char: '⚡', name: 'High Voltage' },
      { char: '☄️', name: 'Comet' },
      { char: '💥', name: 'Collision' },
      { char: '🔥', name: 'Fire' },
      { char: '🌪️', name: 'Tornado' },
      { char: '🌈', name: 'Rainbow' },
      { char: '☀️', name: 'Sun' },
      { char: '🌤️', name: 'Sun Behind Small Cloud' },
      { char: '⛅', name: 'Sun Behind Cloud' },
      { char: '🌥️', name: 'Sun Behind Large Cloud' },
      { char: '☁️', name: 'Cloud' },
      { char: '🌦️', name: 'Sun Behind Rain Cloud' },
      { char: '🌧️', name: 'Cloud with Rain' },
      { char: '⛈️', name: 'Cloud with Lightning and Rain' },
      { char: '🌩️', name: 'Cloud with Lightning' },
      { char: '🌨️', name: 'Cloud with Snow' },
      { char: '❄️', name: 'Snowflake' },
      { char: '☃️', name: 'Snowman' },
      { char: '⛄', name: 'Snowman Without Snow' },
      { char: '🌬️', name: 'Wind Face' },
      { char: '💨', name: 'Dashing Away' },
      { char: '💧', name: 'Droplet' },
      { char: '💦', name: 'Sweat Droplets' },
      { char: '☔', name: 'Umbrella with Rain Drops' },
      { char: '☂️', name: 'Umbrella' },
      { char: '🌊', name: 'Water Wave' },
      { char: '🌫️', name: 'Fog' },
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    emojis: [
      { char: '🍏', name: 'Green Apple' },
      { char: '🍎', name: 'Red Apple' },
      { char: '🍐', name: 'Pear' },
      { char: '🍊', name: 'Tangerine' },
      { char: '🍋', name: 'Lemon' },
      { char: '🍌', name: 'Banana' },
      { char: '🍉', name: 'Watermelon' },
      { char: '🍇', name: 'Grapes' },
      { char: '🍓', name: 'Strawberry' },
      { char: '🍈', name: 'Melon' },
      { char: '🍒', name: 'Cherries' },
      { char: '🍑', name: 'Peach' },
      { char: '🥭', name: 'Mango' },
      { char: '🍍', name: 'Pineapple' },
      { char: '🥥', name: 'Coconut' },
      { char: '🥝', name: 'Kiwi Fruit' },
      { char: '🍅', name: 'Tomato' },
      { char: '🥑', name: 'Avocado' },
      { char: '🥦', name: 'Broccoli' },
      { char: '🥒', name: 'Cucumber' },
      { char: '🌶️', name: 'Hot Pepper' },
      { char: '🌽', name: 'Ear of Corn' },
      { char: '🥕', name: 'Carrot' },
      { char: '🧄', name: 'Garlic' },
      { char: '🧅', name: 'Onion' },
      { char: '🥔', name: 'Potato' },
      { char: '🍠', name: 'Roasted Sweet Potato' },
      { char: '🥐', name: 'Croissant' },
      { char: '🥯', name: 'Bagel' },
      { char: '🍞', name: 'Bread' },
      { char: '🥖', name: 'Baguette Bread' },
      { char: '🥨', name: 'Pretzel' },
      { char: '🧀', name: 'Cheese Wedge' },
      { char: '🥚', name: 'Egg' },
      { char: '🍳', name: 'Cooking' },
      { char: '🧈', name: 'Butter' },
      { char: '🥞', name: 'Pancakes' },
      { char: '🧇', name: 'Waffle' },
      { char: '🥓', name: 'Bacon' },
      { char: '🥩', name: 'Cut of Meat' },
      { char: '🍗', name: 'Poultry Leg' },
      { char: '🍖', name: 'Meat on Bone' },
      { char: '🦴', name: 'Bone' },
      { char: '🌭', name: 'Hot Dog' },
      { char: '🍔', name: 'Hamburger' },
      { char: '🍟', name: 'French Fries' },
      { char: '🍕', name: 'Pizza' },
      { char: '🥪', name: 'Sandwich' },
      { char: '🥙', name: 'Stuffed Flatbread' },
      { char: '🧆', name: 'Falafel' },
      { char: '🌮', name: 'Taco' },
      { char: '🌯', name: 'Burrito' },
      { char: '🥗', name: 'Green Salad' },
      { char: '🥘', name: 'Shallow Pan of Food' },
      { char: '🥫', name: 'Canned Food' },
      { char: '🍝', name: 'Spaghetti' },
      { char: '🍜', name: 'Steaming Bowl' },
      { char: '🍲', name: 'Pot of Food' },
      { char: '🍛', name: 'Curry Rice' },
      { char: '🍣', name: 'Sushi' },
      { char: '🍱', name: 'Bento Box' },
      { char: '🥟', name: 'Dumpling' },
      { char: '🦪', name: 'Oyster' },
      { char: '🍤', name: 'Fried Shrimp' },
      { char: '🍙', name: 'Rice Ball' },
      { char: '🍚', name: 'Cooked Rice' },
      { char: '🍘', name: 'Rice Cracker' },
      { char: '🍥', name: 'Fish Cake with Swirl' },
      { char: '🥠', name: 'Fortune Cookie' },
      { char: '🥮', name: 'Moon Cake' },
      { char: '🍢', name: 'Oden' },
      { char: '🍡', name: 'Dango' },
      { char: '🍧', name: 'Shaved Ice' },
      { char: '🍨', name: 'Ice Cream' },
      { char: '🍦', name: 'Soft Ice Cream' },
      { char: '🥧', name: 'Pie' },
      { char: '🧁', name: 'Cupcake' },
      { char: '🍰', name: 'Shortcake' },
      { char: '🎂', name: 'Birthday Cake' },
      { char: '🍮', name: 'Custard' },
      { char: '🍭', name: 'Lollipop' },
      { char: '🍬', name: 'Candy' },
      { char: '🍫', name: 'Chocolate Bar' },
      { char: '🍿', name: 'Popcorn' },
      { char: '🍩', name: 'Doughnut' },
      { char: '🍪', name: 'Cookie' },
      { char: '🌰', name: 'Chestnut' },
      { char: '🥜', name: 'Peanuts' },
      { char: '🍯', name: 'Honey Pot' },
      { char: '🥛', name: 'Glass of Milk' },
      { char: '🍼', name: 'Baby Bottle' },
      { char: '☕', name: 'Hot Beverage' },
      { char: '🍵', name: 'Teacup Without Handle' },
      { char: '🧃', name: 'Beverage Box' },
      { char: '🥤', name: 'Cup with Straw' },
      { char: '🍶', name: 'Sake' },
      { char: '🍺', name: 'Beer Mug' },
      { char: '🍻', name: 'Clinking Beer Mugs' },
      { char: '🥂', name: 'Clinking Glasses' },
      { char: '🍷', name: 'Wine Glass' },
      { char: '🥃', name: 'Tumbler Glass' },
      { char: '🍸', name: 'Cocktail Glass' },
      { char: '🍹', name: 'Tropical Drink' },
      { char: '🍾', name: 'Bottle with Popping Cork' },
      { char: '🧊', name: 'Ice' },
      { char: '🥄', name: 'Spoon' },
      { char: '🍴', name: 'Fork and Knife' },
      { char: '🍽️', name: 'Fork and Knife with Plate' },
      { char: '🥢', name: 'Chopsticks' },
      { char: '🧂', name: 'Salt' },
    ],
  },
  {
    id: 'activity',
    name: 'Activity & Sports',
    emojis: [
      { char: '⚽', name: 'Soccer Ball' },
      { char: '🏀', name: 'Basketball' },
      { char: '🏈', name: 'American Football' },
      { char: '⚾', name: 'Baseball' },
      { char: '🥎', name: 'Softball' },
      { char: '🎾', name: 'Tennis' },
      { char: '🏐', name: 'Volleyball' },
      { char: '🏉', name: 'Rugby Football' },
      { char: '🥏', name: 'Flying Disc' },
      { char: '🎱', name: 'Pool 8 Ball' },
      { char: '🪀', name: 'Yo-Yo' },
      { char: '🏓', name: 'Ping Pong' },
      { char: '🏸', name: 'Badminton' },
      { char: '🏒', name: 'Ice Hockey' },
      { char: '🏑', name: 'Field Hockey' },
      { char: '🥍', name: 'Lacrosse' },
      { char: '🏏', name: 'Cricket Game' },
      { char: '🥅', name: 'Goal Net' },
      { char: '⛳', name: 'Flag in Hole' },
      { char: '🪁', name: 'Kite' },
      { char: '🏹', name: 'Bow and Arrow' },
      { char: '🎣', name: 'Fishing Pole' },
      { char: '🤿', name: 'Diving Mask' },
      { char: '🥊', name: 'Boxing Glove' },
      { char: '🥋', name: 'Martial Arts Uniform' },
      { char: '🎽', name: 'Running Shirt' },
      { char: '🛹', name: 'Skateboard' },
      { char: '🛷', name: 'Sled' },
      { char: '⛸️', name: 'Ice Skate' },
      { char: '🥌', name: 'Curling Stone' },
      { char: '🎿', name: 'Skis' },
      { char: '⛷️', name: 'Skier' },
      { char: '🏂', name: 'Snowboarder' },
      { char: '🏋️', name: 'Person Lifting Weights' },
      { char: '🤼', name: 'People Wrestling' },
      { char: '🤸', name: 'Person Cartwheeling' },
      { char: '⛹️', name: 'Person Bouncing Ball' },
      { char: '🤺', name: 'Person Fencing' },
      { char: '🤾', name: 'Person Playing Handball' },
      { char: '🏌️', name: 'Person Golfing' },
      { char: '🏇', name: 'Horse Racing' },
      { char: '🧘', name: 'Person in Lotus Position' },
      { char: '🏄', name: 'Person Surfing' },
      { char: '🏊', name: 'Person Swimming' },
      { char: '🤽', name: 'Person Playing Water Polo' },
      { char: '🚣', name: 'Person Rowing Boat' },
      { char: '🧗', name: 'Person Climbing' },
      { char: '🚵', name: 'Person Mountain Biking' },
      { char: '🚴', name: 'Person Biking' },
      { char: '🏆', name: 'Trophy' },
      { char: '🥇', name: '1st Place Medal' },
      { char: '🥈', name: '2nd Place Medal' },
      { char: '🥉', name: '3rd Place Medal' },
      { char: '🏅', name: 'Sports Medal' },
      { char: '🎖️', name: 'Military Medal' },
      { char: '🏵️', name: 'Rosette' },
      { char: '🎗️', name: 'Reminder Ribbon' },
      { char: '🎫', name: 'Ticket' },
      { char: '🎟️', name: 'Admission Tickets' },
      { char: '🎪', name: 'Circus Tent' },
      { char: '🤹', name: 'Person Juggling' },
      { char: '🎭', name: 'Performing Arts' },
      { char: '🎨', name: 'Artist Palette' },
      { char: '🎬', name: 'Clapper Board' },
      { char: '🎤', name: 'Microphone' },
      { char: '🎧', name: 'Headphone' },
      { char: '🎼', name: 'Musical Score' },
      { char: '🎹', name: 'Musical Keyboard' },
      { char: '🥁', name: 'Drum' },
      { char: '🎷', name: 'Saxophone' },
      { char: '🎺', name: 'Trumpet' },
      { char: '🎸', name: 'Guitar' },
      { char: '🪕', name: 'Banjo' },
      { char: '🎻', name: 'Violin' },
      { char: '🎲', name: 'Game Die' },
      { char: '♟️', name: 'Chess Pawn' },
      { char: '🎯', name: 'Bullseye' },
      { char: '🎳', name: 'Bowling' },
      { char: '🎮', name: 'Video Game' },
      { char: '🎰', name: 'Slot Machine' },
      { char: '🧩', name: 'Puzzle Piece' },
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Places',
    emojis: [
      { char: '🚗', name: 'Automobile' },
      { char: '🚕', name: 'Taxi' },
      { char: '🚙', name: 'Sport Utility Vehicle' },
      { char: '🚌', name: 'Bus' },
      { char: '🚎', name: 'Trolleybus' },
      { char: '🏎️', name: 'Racing Car' },
      { char: '🚓', name: 'Police Car' },
      { char: '🚑', name: 'Ambulance' },
      { char: '🚒', name: 'Fire Engine' },
      { char: '🚐', name: 'Minibus' },
      { char: '🚚', name: 'Delivery Truck' },
      { char: '🚛', name: 'Articulated Lorry' },
      { char: '🚜', name: 'Tractor' },
      { char: '🦯', name: 'White Cane' },
      { char: '🦽', name: 'Manual Wheelchair' },
      { char: '🦼', name: 'Motorized Wheelchair' },
      { char: '🛴', name: 'Kick Scooter' },
      { char: '🚲', name: 'Bicycle' },
      { char: '🛵', name: 'Motor Scooter' },
      { char: '🏍️', name: 'Motorcycle' },
      { char: '🛺', name: 'Auto Rickshaw' },
      { char: '🚨', name: 'Police Car Light' },
      { char: '🚔', name: 'Oncoming Police Car' },
      { char: '🚍', name: 'Oncoming Bus' },
      { char: '🚘', name: 'Oncoming Automobile' },
      { char: '🚖', name: 'Oncoming Taxi' },
      { char: '🚡', name: 'Aerial Tramway' },
      { char: '🚠', name: 'Mountain Cableway' },
      { char: '🚟', name: 'Suspension Railway' },
      { char: '🚃', name: 'Railway Car' },
      { char: '🚋', name: 'Tram Car' },
      { char: '🚞', name: 'Mountain Railway' },
      { char: '🚝', name: 'Monorail' },
      { char: '🚄', name: 'High-Speed Train' },
      { char: '🚅', name: 'Bullet Train' },
      { char: '🚈', name: 'Light Rail' },
      { char: '🚂', name: 'Locomotive' },
      { char: '🚆', name: 'Train' },
      { char: '🚇', name: 'Metro' },
      { char: '🚊', name: 'Tram' },
      { char: '🚉', name: 'Station' },
      { char: '✈️', name: 'Airplane' },
      { char: '🛫', name: 'Airplane Departure' },
      { char: '🛬', name: 'Airplane Arrival' },
      { char: '🛩️', name: 'Small Airplane' },
      { char: '💺', name: 'Seat' },
      { char: '🛰️', name: 'Satellite' },
      { char: '🚀', name: 'Rocket' },
      { char: '🛸', name: 'Flying Saucer' },
      { char: '🚁', name: 'Helicopter' },
      { char: '🛶', name: 'Canoe' },
      { char: '⛵', name: 'Sailboat' },
      { char: '🚤', name: 'Speedboat' },
      { char: '🛥️', name: 'Motor Boat' },
      { char: '🛳️', name: 'Passenger Ship' },
      { char: '⛴️', name: 'Ferry' },
      { char: '🚢', name: 'Ship' },
      { char: '⚓', name: 'Anchor' },
      { char: '⛽', name: 'Fuel Pump' },
      { char: '🚧', name: 'Construction' },
      { char: '🚦', name: 'Vertical Traffic Light' },
      { char: '🚥', name: 'Horizontal Traffic Light' },
      { char: '🚏', name: 'Bus Stop' },
      { char: '🗺️', name: 'World Map' },
      { char: '🗿', name: 'Moai' },
      { char: '🗽', name: 'Statue of Liberty' },
      { char: '🗼', name: 'Tokyo Tower' },
      { char: '🏰', name: 'Castle' },
      { char: '🏯', name: 'Japanese Castle' },
      { char: '🏟️', name: 'Stadium' },
      { char: '🎡', name: 'Ferris Wheel' },
      { char: '🎢', name: 'Roller Coaster' },
      { char: '🎠', name: 'Carousel Horse' },
      { char: '⛲', name: 'Fountain' },
      { char: '⛱️', name: 'Umbrella on Ground' },
      { char: '🏖️', name: 'Beach with Umbrella' },
      { char: '🏝️', name: 'Desert Island' },
      { char: '🏜️', name: 'Desert' },
      { char: '🌋', name: 'Volcano' },
      { char: '⛰️', name: 'Mountain' },
      { char: '🏔️', name: 'Snow-Capped Mountain' },
      { char: '🗻', name: 'Mount Fuji' },
      { char: '🏕️', name: 'Camping' },
      { char: '⛺', name: 'Tent' },
      { char: '🏠', name: 'House' },
      { char: '🏡', name: 'House with Garden' },
      { char: '🏘️', name: 'Houses' },
      { char: '🏚️', name: 'Derelict House' },
      { char: '🏗️', name: 'Building Construction' },
      { char: '🏭', name: 'Factory' },
      { char: '🏢', name: 'Office Building' },
      { char: '🏬', name: 'Department Store' },
      { char: '🏣', name: 'Japanese Post Office' },
      { char: '🏤', name: 'Post Office' },
      { char: '🏥', name: 'Hospital' },
      { char: '🏦', name: 'Bank' },
      { char: '🏨', name: 'Hotel' },
      { char: '🏪', name: 'Convenience Store' },
      { char: '🏫', name: 'School' },
      { char: '🏩', name: 'Love Hotel' },
      { char: '💒', name: 'Wedding' },
      { char: '🏛️', name: 'Classical Building' },
      { char: '⛪', name: 'Church' },
      { char: '🕌', name: 'Mosque' },
      { char: '🛕', name: 'Hindu Temple' },
      { char: '🕍', name: 'Synagogue' },
      { char: '⛩️', name: 'Shinto Shrine' },
      { char: '🕋', name: 'Kaaba' },
    ],
  },
  {
    id: 'objects',
    name: 'Objects & Tech',
    emojis: [
      { char: '💻', name: 'Laptop' },
      { char: '🖥️', name: 'Desktop Computer' },
      { char: '🖨️', name: 'Printer' },
      { char: '⌨️', name: 'Keyboard' },
      { char: '🖱️', name: 'Computer Mouse' },
      { char: '💽', name: 'Computer Disk' },
      { char: '💾', name: 'Floppy Disk' },
      { char: '💿', name: 'Optical Disk' },
      { char: '📀', name: 'DVD' },
      { char: '📱', name: 'Mobile Phone' },
      { char: '📲', name: 'Mobile Phone with Arrow' },
      { char: '☎️', name: 'Telephone' },
      { char: '📞', name: 'Telephone Receiver' },
      { char: '📟', name: 'Pager' },
      { char: '📠', name: 'Fax Machine' },
      { char: '🔋', name: 'Battery' },
      { char: '🔌', name: 'Electric Plug' },
      { char: '💡', name: 'Light Bulb' },
      { char: '🔦', name: 'Flashlight' },
      { char: '🕯️', name: 'Candle' },
      { char: '🧯', name: 'Fire Extinguisher' },
      { char: '🛢️', name: 'Oil Drum' },
      { char: '💸', name: 'Money with Wings' },
      { char: '💵', name: 'Dollar Banknote' },
      { char: '💴', name: 'Yen Banknote' },
      { char: '💶', name: 'Euro Banknote' },
      { char: '💷', name: 'Pound Banknote' },
      { char: '🪙', name: 'Coin' },
      { char: '💰', name: 'Money Bag' },
      { char: '💳', name: 'Credit Card' },
      { char: '💎', name: 'Gem Stone' },
      { char: '⚖️', name: 'Balance Scale' },
      { char: '🧰', name: 'Toolbox' },
      { char: '🔧', name: 'Wrench' },
      { char: '🔨', name: 'Hammer' },
      { char: '⚒️', name: 'Hammer and Pick' },
      { char: '🛠️', name: 'Hammer and Wrench' },
      { char: '⛏️', name: 'Pick' },
      { char: '🔩', name: 'Nut and Bolt' },
      { char: '⚙️', name: 'Gear' },
      { char: '🧱', name: 'Brick' },
      { char: '⛓️', name: 'Chains' },
      { char: '🧲', name: 'Magnet' },
      { char: '🔫', name: 'Water Pistol' },
      { char: '💣', name: 'Bomb' },
      { char: '🧨', name: 'Firecracker' },
      { char: '🪓', name: 'Axe' },
      { char: '🔪', name: 'Kitchen Knife' },
      { char: '🗡️', name: 'Dagger' },
      { char: '⚔️', name: 'Crossed Swords' },
      { char: '🛡️', name: 'Shield' },
      { char: '🚬', name: 'Cigarette' },
      { char: '⚰️', name: 'Coffin' },
      { char: '⚱️', name: 'Funeral Urn' },
      { char: '🏺', name: 'Amphora' },
      { char: '🔮', name: 'Crystal Ball' },
      { char: '📿', name: 'Prayer Beads' },
      { char: '🧿', name: 'Nazar Amulet' },
      { char: '💈', name: 'Barber Pole' },
      { char: '⚗️', name: 'Alembic' },
      { char: '🔭', name: 'Telescope' },
      { char: '🔬', name: 'Microscope' },
      { char: '🕳️', name: 'Hole' },
      { char: '🩹', name: 'Adhesive Bandage' },
      { char: '🩺', name: 'Stethoscope' },
      { char: '💊', name: 'Pill' },
      { char: '💉', name: 'Syringe' },
      { char: '🩸', name: 'Drop of Blood' },
      { char: '🧬', name: 'DNA' },
      { char: '🦠', name: 'Microbe' },
      { char: '🧫', name: 'Petri Dish' },
      { char: '🧪', name: 'Test Tube' },
      { char: '🌡️', name: 'Thermometer' },
      { char: '🧹', name: 'Broom' },
      { char: '🧺', name: 'Basket' },
      { char: '🧻', name: 'Roll of Paper' },
      { char: '🧼', name: 'Soap' },
      { char: '🧽', name: 'Sponge' },
      { char: '🗝️', name: 'Old Key' },
      { char: '🔑', name: 'Key' },
      { char: '🔒', name: 'Locked' },
      { char: '🔓', name: 'Unlocked' },
      { char: '🔏', name: 'Locked with Pen' },
      { char: '🔐', name: 'Locked with Key' },
      { char: '📦', name: 'Package' },
      { char: '📫', name: 'Closed Mailbox with Raised Flag' },
      { char: '📬', name: 'Open Mailbox with Raised Flag' },
      { char: '📭', name: 'Open Mailbox with Lowered Flag' },
      { char: '📮', name: 'Postbox' },
      { char: '✉️', name: 'Envelope' },
      { char: '📧', name: 'E-Mail' },
      { char: '📩', name: 'Envelope with Arrow' },
      { char: '📨', name: 'Incoming Envelope' },
      { char: '💌', name: 'Love Letter' },
      { char: '📤', name: 'Outbox Tray' },
      { char: '📥', name: 'Inbox Tray' },
      { char: '📜', name: 'Scroll' },
      { char: '📃', name: 'Page with Curl' },
      { char: '📄', name: 'Page Facing Up' },
      { char: '📑', name: 'Bookmark Tabs' },
      { char: '🧾', name: 'Receipt' },
      { char: '📊', name: 'Bar Chart' },
      { char: '📈', name: 'Chart Increasing' },
      { char: '📉', name: 'Chart Decreasing' },
      { char: '🗒️', name: 'Spiral Notepad' },
      { char: '🗓️', name: 'Spiral Calendar' },
      { char: '📆', name: 'Tear-Off Calendar' },
      { char: '📅', name: 'Calendar' },
      { char: '📇', name: 'Card Index' },
      { char: '🗃️', name: 'Card File Box' },
      { char: '🗳️', name: 'Ballot Box with Ballot' },
      { char: '🗄️', name: 'File Cabinet' },
      { char: '📋', name: 'Clipboard' },
      { char: '📁', name: 'File Folder' },
      { char: '📂', name: 'Open File Folder' },
      { char: '🗂️', name: 'Card Index Dividers' },
      { char: '🗞️', name: 'Rolled-Up Newspaper' },
      { char: '📰', name: 'Newspaper' },
      { char: '📓', name: 'Notebook' },
      { char: '📕', name: 'Closed Book' },
      { char: '📗', name: 'Green Book' },
      { char: '📘', name: 'Blue Book' },
      { char: '📙', name: 'Orange Book' },
      { char: '📚', name: 'Books' },
      { char: '📖', name: 'Open Book' },
      { char: '🔖', name: 'Bookmark' },
      { char: '🏷️', name: 'Label' },
      { char: '🎓', name: 'Graduation Cap' },
      { char: '🎒', name: 'Backpack' },
      { char: '👑', name: 'Crown' },
      { char: '💍', name: 'Ring' },
      { char: '💄', name: 'Lipstick' },
      { char: '🕶️', name: 'Sunglasses' },
      { char: '👓', name: 'Glasses' },
      { char: '🥽', name: 'Goggles' },
      { char: '🥼', name: 'Lab Coat' },
      { char: '🦺', name: 'Safety Vest' },
      { char: '👔', name: 'Necktie' },
      { char: '👕', name: 'T-Shirt' },
      { char: '👖', name: 'Jeans' },
      { char: '👗', name: 'Dress' },
      { char: '👘', name: 'Kimono' },
      { char: '🥻', name: 'Sari' },
      { char: '🩱', name: 'One-Piece Swimsuit' },
      { char: '🩲', name: 'Briefs' },
      { char: '🩳', name: 'Shorts' },
      { char: '👙', name: 'Bikini' },
      { char: '👚', name: 'Woman’s Clothes' },
      { char: '👛', name: 'Purse' },
      { char: '👜', name: 'Handbag' },
      { char: '👝', name: 'Clutch Bag' },
      { char: '🛍️', name: 'Shopping Bags' },
      { char: '👞', name: 'Man’s Shoe' },
      { char: '👟', name: 'Running Shoe' },
      { char: '🥾', name: 'Hiking Boot' },
      { char: '🥿', name: 'Flat Shoe' },
      { char: '👠', name: 'High-Heeled Shoe' },
      { char: '👡', name: 'Woman’s Sandal' },
      { char: '🩰', name: 'Ballet Shoes' },
      { char: '👢', name: 'Woman’s Boot' },
      { char: '👑', name: 'Crown' },
      { char: '👒', name: 'Woman’s Hat' },
      { char: '🎩', name: 'Top Hat' },
      { char: '🧢', name: 'Billed Cap' },
      { char: '⛑️', name: 'Rescue Worker’s Helmet' },
      { char: '📿', name: 'Prayer Beads' },
    ],
  },
  {
    id: 'symbols',
    name: 'Symbols & Flags',
    emojis: [
      { char: '🏧', name: 'ATM Sign' },
      { char: '🚮', name: 'Litter in Bin Sign' },
      { char: '🚰', name: 'Potable Water' },
      { char: '♿', name: 'Wheelchair Symbol' },
      { char: '🚹', name: 'Men’s Room' },
      { char: '🚺', name: 'Women’s Room' },
      { char: '🚻', name: 'Restroom' },
      { char: '🚼', name: 'Baby Symbol' },
      { char: '🚾', name: 'Water Closet' },
      { char: '🛂', name: 'Passport Control' },
      { char: '🛃', name: 'Customs' },
      { char: '🛄', name: 'Baggage Claim' },
      { char: '🛅', name: 'Left Luggage' },
      { char: '⚠️', name: 'Warning' },
      { char: '🚸', name: 'Children Crossing' },
      { char: '⛔', name: 'No Entry' },
      { char: '🚫', name: 'Prohibited' },
      { char: '🚳', name: 'No Bicycles' },
      { char: '🚭', name: 'No Smoking' },
      { char: '🚯', name: 'No Littering' },
      { char: '🚱', name: 'Non-Potable Water' },
      { char: '🚷', name: 'No Pedestrians' },
      { char: '📵', name: 'No Mobile Phones' },
      { char: '🔞', name: 'No One Under Eighteen' },
      { char: '☢️', name: 'Radioactive' },
      { char: '☣️', name: 'Biohazard' },
      { char: '⬆️', name: 'Up Arrow' },
      { char: '↗️', name: 'Up-Right Arrow' },
      { char: '➡️', name: 'Right Arrow' },
      { char: '↘️', name: 'Down-Right Arrow' },
      { char: '⬇️', name: 'Down Arrow' },
      { char: '↙️', name: 'Down-Left Arrow' },
      { char: '⬅️', name: 'Left Arrow' },
      { char: '↖️', name: 'Up-Left Arrow' },
      { char: '↕️', name: 'Up-Down Arrow' },
      { char: '↔️', name: 'Left-Right Arrow' },
      { char: '↩️', name: 'Right Arrow Curving Left' },
      { char: '↪️', name: 'Left Arrow Curving Right' },
      { char: '⤴️', name: 'Right Arrow Curving Up' },
      { char: '⤵️', name: 'Right Arrow Curving Down' },
      { char: '🔃', name: 'Clockwise Vertical Arrows' },
      { char: '🔄', name: 'Counterclockwise Arrows Button' },
      { char: '🔙', name: 'Back Arrow' },
      { char: '🔚', name: 'End Arrow' },
      { char: '🔛', name: 'On! Arrow' },
      { char: '🔜', name: 'Soon Arrow' },
      { char: '🔝', name: 'Top Arrow' },
      { char: '🛐', name: 'Place of Worship' },
      { char: '🕉️', name: 'Om' },
      { char: '✡️', name: 'Star of David' },
      { char: '☸️', name: 'Wheel of Dharma' },
      { char: '☯️', name: 'Yin Yang' },
      { char: '✝️', name: 'Latin Cross' },
      { char: '☦️', name: 'Orthodox Cross' },
      { char: '☪️', name: 'Star and Crescent' },
      { char: '☮️', name: 'Peace Symbol' },
      { char: '🕎', name: 'Menorah' },
      { char: '🔯', name: 'Dotted Six-Pointed Star' },
      { char: '♈', name: 'Aries' },
      { char: '♉', name: 'Taurus' },
      { char: '♊', name: 'Gemini' },
      { char: '♋', name: 'Cancer' },
      { char: '♌', name: 'Leo' },
      { char: '♍', name: 'Virgo' },
      { char: '♎', name: 'Libra' },
      { char: '♏', name: 'Scorpio' },
      { char: '♐', name: 'Sagittarius' },
      { char: '♑', name: 'Capricorn' },
      { char: '♒', name: 'Aquarius' },
      { char: '♓', name: 'Pisces' },
      { char: '⛎', name: 'Ophiuchus' },
      { char: '🔀', name: 'Shuffle Tracks Button' },
      { char: '🔁', name: 'Repeat Button' },
      { char: '🔂', name: 'Repeat Single Button' },
      { char: '▶️', name: 'Play Button' },
      { char: '⏩', name: 'Fast-Forward Button' },
      { char: '⏭️', name: 'Next Track Button' },
      { char: '⏯️', name: 'Play or Pause Button' },
      { char: '◀️', name: 'Reverse Button' },
      { char: '⏪', name: 'Fast Reverse Button' },
      { char: '⏮️', name: 'Last Track Button' },
      { char: '🔼', name: 'Upwards Button' },
      { char: '⏫', name: 'Fast Up Button' },
      { char: '🔽', name: 'Downwards Button' },
      { char: '⏬', name: 'Fast Down Button' },
      { char: '⏸️', name: 'Pause Button' },
      { char: '⏹️', name: 'Stop Button' },
      { char: '⏺️', name: 'Record Button' },
      { char: '⏏️', name: 'Eject Button' },
      { char: '🎦', name: 'Cinema' },
      { char: '🔅', name: 'Dim Button' },
      { char: '🔆', name: 'Bright Button' },
      { char: '📶', name: 'Antenna Bars' },
      { char: '📳', name: 'Vibration Mode' },
      { char: '📴', name: 'Mobile Phone Off' },
      { char: '♀️', name: 'Female Sign' },
      { char: '♂️', name: 'Male Sign' },
      { char: '⚧️', name: 'Transgender Symbol' },
      { char: '✖️', name: 'Multiply' },
      { char: '➕', name: 'Plus' },
      { char: '➖', name: 'Minus' },
      { char: '➗', name: 'Divide' },
      { char: '♾️', name: 'Infinity' },
      { char: '‼️', name: 'Double Exclamation Mark' },
      { char: '⁉️', name: 'Exclamation Question Mark' },
      { char: '❓', name: 'Question Mark' },
      { char: '❔', name: 'White Question Mark' },
      { char: '❕', name: 'White Exclamation Mark' },
      { char: '❗', name: 'Exclamation Mark' },
      { char: '〰️', name: 'Wavy Dash' },
      { char: '💱', name: 'Currency Exchange' },
      { char: '💲', name: 'Heavy Dollar Sign' },
      { char: '⚕️', name: 'Medical Symbol' },
      { char: '♻️', name: 'Recycling Symbol' },
      { char: '⚜️', name: 'Fleur-de-lis' },
      { char: '🔱', name: 'Trident Emblem' },
      { char: '📛', name: 'Name Badge' },
      { char: '🔰', name: 'Japanese Symbol for Beginner' },
      { char: '⭕', name: 'Hollow Red Circle' },
      { char: '✅', name: 'Check Mark Button' },
      { char: '☑️', name: 'Check Box with Check' },
      { char: '✔️', name: 'Check Mark' },
      { char: '❌', name: 'Cross Mark' },
      { char: '❎', name: 'Cross Mark Button' },
      { char: '➰', name: 'Curly Loop' },
      { char: '➿', name: 'Double Curly Loop' },
      { char: '〽️', name: 'Part Alternation Mark' },
      { char: '✳️', name: 'Eight-Spoked Asterisk' },
      { char: '✴️', name: 'Eight-Pointed Star' },
      { char: '❇️', name: 'Sparkle' },
      { char: '©️', name: 'Copyright' },
      { char: '®️', name: 'Registered' },
      { char: '™️', name: 'Trade Mark' },
      { char: '🏁', name: 'Chequered Flag' },
      { char: '🚩', name: 'Triangular Flag' },
      { char: '🎌', name: 'Crossed Flags' },
      { char: '🏴', name: 'Black Flag' },
      { char: '🏳️', name: 'White Flag' },
      { char: '🏳️‍🌈', name: 'Rainbow Flag' },
      { char: '🏳️‍⚧️', name: 'Transgender Flag' },
      { char: '🏴‍☠️', name: 'Pirate Flag' },
      { char: '🇮🇳', name: 'Flag: India' },
      { char: '🇺🇸', name: 'Flag: United States' },
      { char: '🇬🇧', name: 'Flag: United Kingdom' },
      { char: '🇨🇦', name: 'Flag: Canada' },
      { char: '🇦🇺', name: 'Flag: Australia' },
      { char: '🇩🇪', name: 'Flag: Germany' },
      { char: '🇫🇷', name: 'Flag: France' },
      { char: '🇯🇵', name: 'Flag: Japan' },
      { char: '🇷🇺', name: 'Flag: Russia' },
      { char: '🇧🇷', name: 'Flag: Brazil' },
    ],
  },
];

export default function WhatsAppEmojiPicker({
  onSelectEmoji,
  isDark = true,
  themeAccent = '#6e00ff',
}) {
  const [activeCategory, setActiveCategory] = useState('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cpa_recent_emojis');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return ['😄', '🔥', '👍', '❤️', '🚀', '✨', '💻', '🎉'];
  });
  const [activeBottomTab, setActiveBottomTab] = useState('emoji');
  const isProgrammaticScroll = useRef(false);

  const scrollContainerRef = useRef(null);
  const categoryRefs = useRef({});

  // Sync recent emojis
  const handleEmojiClick = (emojiChar) => {
    onSelectEmoji(emojiChar);
    setRecentEmojis((prev) => {
      const updated = [emojiChar, ...prev.filter((e) => e !== emojiChar)].slice(0, 18);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cpa_recent_emojis', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  // Scroll to category on top icon click
  const scrollToCategory = (categoryId) => {
    setActiveCategory(categoryId);
    isProgrammaticScroll.current = true;
    const target = categoryRefs.current[categoryId];
    if (target && scrollContainerRef.current) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 600);
  };

  // Dynamic Scroll-Spy: detect which category is in view
  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current || searchQuery.trim() || !scrollContainerRef.current) return;

    const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
    let closestCategory = null;
    let smallestDistance = Infinity;

    ALL_EMOJI_CATEGORIES.forEach((cat) => {
      const el = categoryRefs.current[cat.id];
      if (el) {
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerTop);
        if (rect.top - containerTop <= 60 && distance < smallestDistance) {
          smallestDistance = distance;
          closestCategory = cat.id;
        }
      }
    });

    if (closestCategory && closestCategory !== activeCategory) {
      setActiveCategory(closestCategory);
    }
  }, [activeCategory, searchQuery]);

  // Filter emojis by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return ALL_EMOJI_CATEGORIES.map((cat) => {
        if (cat.id === 'recent') {
          return {
            ...cat,
            emojis: recentEmojis.map((e) => ({ char: e, name: 'recent' })),
          };
        }
        return cat;
      });
    }

    const q = searchQuery.toLowerCase().trim();
    return ALL_EMOJI_CATEGORIES.map((cat) => {
      const sourceEmojis = cat.id === 'recent'
        ? recentEmojis.map((e) => ({ char: e, name: 'recent' }))
        : cat.emojis;
      const matched = sourceEmojis.filter((e) => e.name.toLowerCase().includes(q) || e.char === q);
      return { ...cat, emojis: matched };
    }).filter((cat) => cat.emojis.length > 0);
  }, [searchQuery, recentEmojis]);

  const brandAccent = themeAccent || '#6e00ff';

  return (
    <div
      className="whatsapp-emoji-modal flex flex-col rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      style={{
        width: 'min(440px, 94vw)',
        height: '420px',
        backgroundColor: isDark ? 'rgba(15, 20, 25, 0.98)' : '#ffffff',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: isDark
          ? '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06)'
          : '0 20px 50px rgba(0, 0, 0, 0.18)',
        fontFamily: 'inherit',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {activeBottomTab === 'emoji' ? (
        <>
          {/* ── 1. Top Category Navigation Bar with Scroll-Spy & Brand Accent ───── */}
          <div
            className="flex items-center justify-between px-2 pt-2 pb-1 border-b"
            style={{
              backgroundColor: isDark ? 'rgba(21, 28, 36, 0.8)' : '#f8fafc',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {ALL_EMOJI_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const isActive = activeCategory === cat.id && !searchQuery;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => scrollToCategory(cat.id)}
                  className="relative p-2 rounded-lg transition-all flex items-center justify-center flex-1 cursor-pointer"
                  style={{
                    color: isActive ? brandAccent : (isDark ? '#94a3b8' : '#64748b'),
                  }}
                  title={cat.name}
                >
                  <IconComp size={18} />
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{
                        backgroundColor: brandAccent,
                        boxShadow: `0 0 8px ${brandAccent}aa`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── 2. WhatsApp Capsule Search Bar (Brand Colors) ─────────────────── */}
          <div className="px-3 pt-2.5 pb-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f1f5f9',
                border: `1px solid ${searchQuery ? brandAccent : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0')}`,
                boxShadow: searchQuery ? `0 0 10px ${brandAccent}33` : 'none',
              }}
            >
              <Search size={15} style={{ color: isDark ? '#94a3b8' : '#64748b' }} className="flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emoji..."
                className="w-full bg-transparent border-none outline-none text-xs leading-none"
                style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── 3. Scrollable Emoji Grid with Scroll-Spy ───────────────────────── */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="edm-scroll flex-1 overflow-y-auto px-3 py-1 space-y-4"
            style={{
              scrollBehavior: 'smooth',
            }}
          >
            {filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-xs gap-2">
                <span>No emojis found for "{searchQuery}"</span>
              </div>
            ) : (
              filteredCategories.map((category) => {
                if (category.emojis.length === 0) return null;
                return (
                  <div
                    key={category.id}
                    ref={(el) => {
                      categoryRefs.current[category.id] = el;
                    }}
                    className="space-y-1.5"
                  >
                    {/* Category Header */}
                    <h5
                      className="text-[11.5px] font-semibold sticky top-0 py-1 z-10"
                      style={{
                        backgroundColor: isDark ? 'rgba(15, 20, 25, 0.98)' : '#ffffff',
                        color: isDark ? '#94a3b8' : '#64748b',
                      }}
                    >
                      {category.name}
                    </h5>

                    {/* Emoji Grid (8 columns) */}
                    <div className="grid grid-cols-8 gap-1">
                      {category.emojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleEmojiClick(emoji.char)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg text-2xl hover:scale-125 hover:bg-white/10 active:scale-95 transition-transform select-none cursor-pointer"
                          title={emoji.name}
                        >
                          {emoji.char}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : activeBottomTab === 'gif' ? (
        /* ── GIF Coming Soon View ────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: `${brandAccent}20`,
              color: brandAccent,
              border: `1px solid ${brandAccent}40`,
              boxShadow: `0 8px 24px ${brandAccent}22`,
            }}
          >
            <Film size={32} />
          </div>
          <div className="space-y-1">
            <h4
              className="text-base font-bold tracking-tight"
              style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
            >
              GIFs Coming Soon
            </h4>
            <p
              className="text-xs max-w-xs leading-relaxed"
              style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              Share high-energy animated GIF reactions and memes directly in your Code Plus Academy conversations.
            </p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-[10.5px] font-mono font-semibold tracking-wider uppercase mt-1"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
              color: brandAccent,
              border: `1px solid ${brandAccent}33`,
            }}
          >
            In Active Development
          </div>
        </div>
      ) : (
        /* ── Sticker Coming Soon View ────────────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: `${brandAccent}20`,
              color: brandAccent,
              border: `1px solid ${brandAccent}40`,
              boxShadow: `0 8px 24px ${brandAccent}22`,
            }}
          >
            <Sticker size={32} />
          </div>
          <div className="space-y-1">
            <h4
              className="text-base font-bold tracking-tight"
              style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
            >
              Stickers Coming Soon
            </h4>
            <p
              className="text-xs max-w-xs leading-relaxed"
              style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              Custom Code+ developer sticker packs, tech badges, and college study reaction sets.
            </p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-[10.5px] font-mono font-semibold tracking-wider uppercase mt-1"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
              color: brandAccent,
              border: `1px solid ${brandAccent}33`,
            }}
          >
            In Active Development
          </div>
        </div>
      )}

      {/* ── 4. Bottom Segmented Footer (Emoji / GIF / Sticker) with Brand Glow ─ */}
      <div
        className="flex items-center justify-center py-2 px-3 border-t"
        style={{
          backgroundColor: isDark ? 'rgba(21, 28, 36, 0.8)' : '#f8fafc',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <div
          className="flex items-center rounded-full p-0.5"
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveBottomTab('emoji')}
            className={`px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeBottomTab === 'emoji'
                ? 'text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            style={{
              backgroundColor: activeBottomTab === 'emoji' ? brandAccent : 'transparent',
              boxShadow: activeBottomTab === 'emoji' ? `0 2px 10px ${brandAccent}66` : 'none',
            }}
          >
            <Smile size={14} />
            <span>Emoji</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab('gif')}
            className={`px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeBottomTab === 'gif'
                ? 'text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            style={{
              backgroundColor: activeBottomTab === 'gif' ? brandAccent : 'transparent',
              boxShadow: activeBottomTab === 'gif' ? `0 2px 10px ${brandAccent}66` : 'none',
            }}
          >
            <span className="font-bold text-[10px]">GIF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab('sticker')}
            className={`px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeBottomTab === 'sticker'
                ? 'text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            style={{
              backgroundColor: activeBottomTab === 'sticker' ? brandAccent : 'transparent',
              boxShadow: activeBottomTab === 'sticker' ? `0 2px 10px ${brandAccent}66` : 'none',
            }}
          >
            <Sticker size={14} />
            <span>Sticker</span>
          </button>
        </div>
      </div>
    </div>
  );
}
