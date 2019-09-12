const fs = require('fs')

const runeDir = '../content/docs/reference/hoon-expressions/rune/'

const outDir = 'runes.json'

const rune = {
  name: '',
  usage: '',
  symbol: '',
  link: '',
  desc: '',
  childRunes: []
}

const childRune = {
  name: '',
  usage: '',
  symbol: '',
  link: '',
  desc: ''
}

const writeData = (data, path) => {
  const fmtData = JSON.stringify(data, null, 2)
  fs.writeFile(path, fmtData, (err) => {
    if (err) throw err
  })
}

const getFile = (name) => {
  return fs.readFileSync(name, 'utf8')
}

// example input: "### [`! zap` (wild)](@/docs/reference/hoon-expressions/rune/zap.md)"
// example out: rune: symbol: "!", name: "zap", usage: "wild", link: "@/docs..."
const parseLine = (line) => {
  line = line.replace(/#/g,'')  // remove: #
  line = line.replace(/\[/g,'') // [
  line = line.replace(/\]/g,'') // ]
  line = line.replace(/\)/g,'') // )
  line = line.replace(/\`/g,'') // `

  // split into array for object creation
  line = line.split('(')
  line[0] = line[0].split(' ').filter(function(c){ return c !== '' })

  if(line.length > 2)
    return {
      name: line[0][1] === "==" ? "terminators" : line[0][1],
      symbol: line[0][0],
      usage: line[1],
      link: line[2]
    }
  return {}
}

// returns array of base runes object such as | alongisde its link, symbol, name and usage
const getParentRunes = () => {
  const parentDir = `${runeDir}_index.md`
  var lines = getFile(parentDir).split('\n')

  const spliceIndex = (lines) => {
    for (l in lines)
      if(lines[l].includes("Runes Proper"))
        return l
  };

  // only look at lines under the "Runes Proper" header
  lines = lines.splice(spliceIndex(lines), lines.length - spliceIndex(lines))

  // remove empty spacing lines
  lines = lines.filter(function(line){ return line !== '' })

  var data = rune
  lines = lines.map(function(line){
    // looking for line of form '[`. dot` (Nock)]...'
    if(line.includes("###"))
      data = parseLine(line)

    // line of plain text form 'Runes used for carrying out...'
    else if(!line.includes("#")){
      data.desc = line
      return data
    }
  }).filter(function(w){ return w !== undefined})
  return lines
}

// returns all children runes from a given parentRune
const parseChildRune = (usage, parentRune) => {
  // get rune file, ex: bar.md
  var lines = getFile(`${runeDir}${parentRune}.md`).split('\n')

  lines = lines.map(function(line){
    // looking for line of form '### |@ "barvat"'
    if(line.includes('###') && !line.includes('####') && !line.includes("Desugaring")){

        // desc exists 2 lines below the title header
        var desc = lines[lines.indexOf(line)+2]
        if(desc.includes('#')) desc = lines[lines.indexOf(line)+4]

        // remove formatting from header line
        line = line.replace("### ", '')
        line = line.replace(/"/g, '')
        line = line.split(' ')

        // convert `line` into array of form [ '==', 'tistis' ]
        const symbol = line[0]
        const name = line[1]
        const link = `${runeDir}${parentRune}.md#${name}`
        return {
          name: name,
          symbol: symbol,
          usage: usage,
          link: link,
          desc: desc
        }
    }
  }
).filter(function(w){ return w !== undefined })
  return lines
}

const compileRunes = () => {
  var parentRunes = getParentRunes()

  // merge the parent and child runes into a single array
  var merge = []

  // for every parent rune, get the child runes from dir/name-of-parent-rune.md
  Object.values(parentRunes).map(function(rune){
    if(rune !== undefined){
      var childRunes = parseChildRune(rune.usage, rune.name)

      // add the parent rune before the child runes
      childRunes.unshift(rune)

      // merge this iteration of childRunes with the final array of data
      merge = merge.concat(childRunes)
    }
  }).filter(function(w){ return w !== undefined})


  writeData(merge, outDir)
  console.log(`Saved rune data in ${outDir}.`)
}

compileRunes()
