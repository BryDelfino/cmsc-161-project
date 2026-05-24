# CMSC 161 PROJECT (Bagge Family House Living Room)
Created by: Bryan Kyle V. Delfino <br>
Student Number: 2021-02141 <br>
Section: B-1L

## Project Description
A WebGL program scene that creates a living room and outdoor porch area. The scene was based on the living room from the animated series <i>"Courage the Cowardly Dog."</i>

## How To Run?
1. Either clone the repository or Download ZIP to your local machine.
2. On a terminal, navigate to the project’s directory.
3. Run the command `npx serve`. 
4. On the browser, navigate your way to the `src` directory.
5. Click on the `main.html` file.
6. Enjoy!

## Codebase
`assets` - directory containing `skybox` cubemap textures and `textures` for objects. <br>
`src` - the main directory. <br>
inside the `src`, we have the following files and subdirectories: <br>
&emsp; `house` - subdirectory of `src` containing the creation and rendering of the house object (root node), its parts and furniture (children). <br>
&emsp; `camera.js` - camera object that defines perspective, camera movement alongside their keybinds and mouse movements. <br>
&emsp; `floor.js` - the world floor (root node). <br>
&emsp; `main.html` - main HTML file for web rendering. <br>
&emsp; `scenegraph.js` - defines node, mesh node, and primitive objects. <br>
&emsp; `shaders.js` - defines vertex and fragment shaders for solid-colored, textured objects; skybox, and shadows. <br>
&emsp; `skybox.js` - creates and renders the skybox. <br>
&emsp; `source.js` - the main render loop. <br>
`utils` - where `gl-matrix.js` is stored. 

## REFERENCES USED IN CREATING THE PROJECT
<b>WebGL Fundamentals Website: </b> https://webglfundamentals.org/ <br>
<b>WebGL Tutorials by Indigo Code: </b> https://youtube.com/playlist?list=PLjcVFFANLS5zH_PeKC6I8p0Pt1hzph_rt&si=EM2by3W_AV-qOdaU <br>
<b>CMSC 161 Lecture Slides </b> <br>
<b>CMSC 161 Laboratory Exercises </b> <br>
<i>(Though the next 2 references are WebGL 2.0, I still found them helpful in learning the concepts) <br> </i>
<b>WebGL 2.0 by Andrew Adamson: </b> https://youtube.com/playlist?list=PLPbmjY2NVO_X1U1JzLxLDdRn4NmtxyQQo&si=U0RyZwzQzgzxN78- <br>
<b>Fun With WebGL 2.0 by SketchpunkLabs: </b> https://youtube.com/playlist?list=PLMinhigDWz6emRKVkVIEAaePW7vtIkaIF&si=PaQX3uzHAUlHVXl1 <br>

## Screenshots
<img width="1597" height="738" alt="Screenshot 2026-05-24 211732" src="https://github.com/user-attachments/assets/bf007440-d033-4024-8730-f87b17f8ead6" />
<img width="1599" height="744" alt="Screenshot 2026-05-25 003331" src="https://github.com/user-attachments/assets/05fbacef-ac30-4759-be04-144285ad0b79" />
<img width="1599" height="899" alt="Screenshot 2026-05-24 110008" src="https://github.com/user-attachments/assets/bae35dab-7edc-48ea-8c10-7c9fdee15117" />
<img width="1598" height="740" alt="Screenshot 2026-05-25 003241" src="https://github.com/user-attachments/assets/a343d593-0626-4dda-a32a-8322aa2e1575" />
<img width="1599" height="739" alt="Screenshot 2026-05-25 003645" src="https://github.com/user-attachments/assets/c353043d-ebdc-47e1-a4de-01e7369490ad" />
<img width="1595" height="738" alt="Screenshot 2026-05-25 003610" src="https://github.com/user-attachments/assets/e5b46f12-44e5-4c1f-b16c-3a91af74de81" />
<img width="1596" height="739" alt="Screenshot 2026-05-25 003505" src="https://github.com/user-attachments/assets/3222cb8c-daa4-4582-89f6-ba3191db080e" />

## Video Demo
https://drive.google.com/file/d/1lWuGyPhz0F5Oc4ptjwm0szkeTXWz_9BC/view?usp=sharing

## Report
[CMSC 161 Project Report_Delfino.pdf](https://github.com/user-attachments/files/28196784/CMSC.161.Project.Report_Delfino.pdf)




