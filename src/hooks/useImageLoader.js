import { useState } from "react";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { storage, db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export const useImageLoader = () => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState(null);

  // Configuration: Number of least responded datasets to select
  const MAX_DATASETS_TO_SELECT = 7;

  const EXCLUDED_DATASETS = [
    "Zoom_Class_Meeting_Downing_Soc_220_2-18-2021-clean",
    "TMU_-_History_102_-_ZOOM_Class_Meeting_-_March_25th,_2020-clean",
    "2021-05-24_-_Club_Meeting_-_Gallery_View-clean"
  ];

  const getRandomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const getRandomElements = (array, n) => {
    // Returns up to N different elements from array (without repeating)
    const arr = [...array];
    const result = [];
    while (arr.length && result.length < n) {
      const idx = Math.floor(Math.random() * arr.length);
      result.push(arr.splice(idx, 1)[0]);
    }
    return result;
  };

  // Counts the number of responses per dataset
  const getDatasetResponseCounts = async () => {
    const datasetCounts = new Map();

    const querySnapshot = await getDocs(collection(db, "global-survey-evaluations"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.image && data.image.dataset) {
        const dataset = data.image.dataset;
        datasetCounts.set(dataset, (datasetCounts.get(dataset) || 0) + 1);
      }
    });

    return datasetCounts;
  };

  // Reads from Firestore the subfolders already used
  const getUsedSubfolders = async () => {
    const usedPaths = new Set();

    const querySnapshot = await getDocs(collection(db, "global-survey-evaluations"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.image && data.image.dataset && data.image.folder) {
        const path = `${data.image.dataset}/${data.image.folder}`;
        usedPaths.add(path);
      }
    });

    return usedPaths;
  };

  const loadImagesWithFolderLogic = async () => {
    setLoadingImages(true);
    setError(null);

    try {
      // 1. Get response counts per dataset and already used subfolders
      const [datasetCounts, usedPaths] = await Promise.all([
        getDatasetResponseCounts(),
        getUsedSubfolders()
      ]);

      // console.log("Dataset count:", Object.fromEntries(datasetCounts));

      // 2. Get all main folders from storage
      const rootRef = ref(storage, "/");
      const rootResult = await listAll(rootRef);

      // 3. Filter excluded datasets
      const filteredMainFolders = rootResult.prefixes.filter(
        (mainFolder) => !EXCLUDED_DATASETS.includes(mainFolder.name)
      );

      // 4. Calculate available datasets with unused subfolders
      const availableDatasets = [];
      for (const mainFolder of filteredMainFolders) {
        const subFoldersResult = await listAll(mainFolder);
        const availableSubfolders = subFoldersResult.prefixes.filter(
          (sf) => !usedPaths.has(`${mainFolder.name}/${sf.name}`)
        );
        
        if (availableSubfolders.length > 0) {
          const responseCount = datasetCounts.get(mainFolder.name) || 0;
          availableDatasets.push({
            mainFolder,
            subFolders: availableSubfolders,
            responseCount
          });
        }
      }

      // 5. Sort datasets by response count (least responded first)
      availableDatasets.sort((a, b) => a.responseCount - b.responseCount);

      // 6. Select the least responded datasets (up to MAX_DATASETS_TO_SELECT)
      const selectedDatasets = availableDatasets.slice(0, Math.min(MAX_DATASETS_TO_SELECT, availableDatasets.length));

      // console.log("Selected datasets (less answered):", 
      //   selectedDatasets.map(d => ({ 
      //     name: d.mainFolder.name, 
      //     responses: d.responseCount,
      //     availableSubfolders: d.subFolders.length 
      //   }))
      // );

      // 7. Select 1 subfolder from each dataset, completing with the least responded if needed
      const selectedSubfolders = [];
      
      // First, add 1 subfolder from each available dataset
      for (const dataset of selectedDatasets) {
        if (selectedSubfolders.length < MAX_DATASETS_TO_SELECT) {
          const randomSubfolder = getRandomElement(dataset.subFolders);
          selectedSubfolders.push({
            mainFolder: dataset.mainFolder,
            subFolder: randomSubfolder
          });
        }
      }

      // If we have less than MAX_DATASETS_TO_SELECT subfolders and there are still datasets available,
      // complete with additional subfolders from the least responded dataset
      if (selectedSubfolders.length < MAX_DATASETS_TO_SELECT && selectedDatasets.length > 0) {
        const leastRespondedDataset = selectedDatasets[0]; // First in list (least responded)
        
        // Subfolders already selected from this dataset
        const alreadySelected = selectedSubfolders
          .filter(s => s.mainFolder.name === leastRespondedDataset.mainFolder.name)
          .map(s => s.subFolder.name);
        
        // Available subfolders that haven't been selected yet
        const remainingSubfolders = leastRespondedDataset.subFolders
          .filter(sf => !alreadySelected.includes(sf.name));

        // Add additional subfolders until we reach the maximum
        const needed = MAX_DATASETS_TO_SELECT - selectedSubfolders.length;
        const additionalSubfolders = getRandomElements(remainingSubfolders, Math.min(needed, remainingSubfolders.length));
        
        for (const subFolder of additionalSubfolders) {
          selectedSubfolders.push({
            mainFolder: leastRespondedDataset.mainFolder,
            subFolder: subFolder
          });
        }
      }

      // console.log("Selected subfolders:", selectedSubfolders.map(s => `${s.mainFolder.name}/${s.subFolder.name}`));

      // 8. Process images from selected subfolders
      let allGroups = [];
      for (const { mainFolder, subFolder } of selectedSubfolders) {
        const datasetName = mainFolder.name;

        const subfolderResult = await listAll(subFolder);
        if (subfolderResult.items.length === 0) continue;

        // Context image ("0") and evaluation images
        const contextItem = subfolderResult.items.find(
          (item) => item.name.split(".")[0] === "0"
        );
        const evaluationItems = subfolderResult.items.filter(
          (item) => item.name.split(".")[0] !== "0"
        );

        let contextImage = null;
        if (contextItem) {
          const contextUrl = await getDownloadURL(contextItem);
          contextImage = {
            name: contextItem.name,
            url: contextUrl,
            folder: subFolder.name,
            datasetName,
            isContext: true,
            fileName: "0",
          };
        }

        const evaluationImages = [];
        for (const img of evaluationItems) {
          const url = await getDownloadURL(img);
          const nameWithoutExt = img.name.split(".")[0];
          evaluationImages.push({
            name: img.name,
            url,
            folder: subFolder.name,
            datasetName,
            isContext: false,
            fileName: nameWithoutExt,
          });
        }

        if (contextImage && evaluationImages.length > 0) {
          allGroups.push({ contextImage, evaluationImages });
        }
      }

      setSelectedImages(allGroups);
      return allGroups;
    } catch (error) {
      console.error("Error loading images:", error);
      setError(error.message);
      setSelectedImages([]);
      throw error;
    } finally {
      setLoadingImages(false);
    }
  };

  const resetImages = () => {
    setSelectedImages([]);
    setError(null);
  };

  return {
    selectedImages,
    loadingImages,
    error,
    loadImagesWithFolderLogic,
    resetImages,
  };
};